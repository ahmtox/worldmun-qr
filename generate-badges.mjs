import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import QRCode from "qrcode";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { PDFDocument } from "pdf-lib";

// --- Config ---
const SHEET_ID = "1vzz-LSSeFGscHZesKoR8RzdteKPiGl5ILq2Uni6uPuo";
const PDF_PATH = join(import.meta.dirname, "observers.pdf");
const OUTPUT_DIR = join(import.meta.dirname, "badges");
const INDIVIDUAL_DIR = join(OUTPUT_DIR, "individual");
const QR_DIR = join(OUTPUT_DIR, "qrcodes");

// Pages 1-2 are templates, real names start at page 3 (0-indexed: 2)
const FIRST_REAL_PAGE = 2;

// QR code placement: bottom-left white box
// The white box is approximately 65x65 points, starting around x=28, y=28 from bottom-left
const QR_X = 20;
const QR_Y = 11;
const QR_SIZE = 76;

mkdirSync(INDIVIDUAL_DIR, { recursive: true });
mkdirSync(QR_DIR, { recursive: true });

// --- Auth ---
const creds = JSON.parse(readFileSync("sa.json", "utf8"));
const auth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// --- Load spreadsheet ---
const doc = new GoogleSpreadsheet(SHEET_ID, auth);
await doc.loadInfo();

const namesSheet = doc.sheetsByTitle["NAMES"];
if (!namesSheet) {
  console.error('ERROR: No "NAMES" sheet found in the spreadsheet.');
  process.exit(1);
}

await namesSheet.loadHeaderRow();
const headers = namesSheet.headerValues;
console.log("NAMES sheet headers:", headers);

// Ensure QR_UID column exists
if (!headers.includes("QR_UID")) {
  console.log("Adding QR_UID column to NAMES sheet...");
  await namesSheet.setHeaderRow([...headers, "QR_UID"]);
  await namesSheet.loadHeaderRow();
}

const namesRows = await namesSheet.getRows();
console.log(`Found ${namesRows.length} rows in NAMES sheet.`);

// --- Load PDF ---
const pdfBytes = readFileSync(PDF_PATH);
const pdfDoc = await PDFDocument.load(pdfBytes);
const totalPages = pdfDoc.getPageCount();
console.log(`PDF has ${totalPages} pages. Real names on pages ${FIRST_REAL_PAGE + 1}-${totalPages}.`);

const realPageCount = totalPages - FIRST_REAL_PAGE;
console.log(`${realPageCount} badge pages, ${namesRows.length} names in sheet.`);

if (realPageCount !== namesRows.length) {
  console.warn(
    `WARNING: Page count (${realPageCount}) != sheet row count (${namesRows.length}). ` +
    `Will process min(${Math.min(realPageCount, namesRows.length)}) entries.`
  );
}

const count = Math.min(realPageCount, namesRows.length);

// --- Generate UIDs and QR codes, then embed into PDF pages ---
function generateUID(index) {
  return "obs-" + String(index + 1).padStart(4, "0");
}

// Combined PDF for all badges
const combinedPdf = await PDFDocument.create();

console.log("\nProcessing badges...");

for (let i = 0; i < count; i++) {
  const row = namesRows[i];
  const fullName = row.get("FULL_NAME") || row.get(headers[0]) || `Unknown_${i}`;

  // Generate sequential UID (always overwrite to ensure linear ordering)
  const uid = generateUID(i);
  row.set("QR_UID", uid);
  await row.save();

  // Generate QR code PNG buffer (no text, just QR)
  const qrPngBuffer = await QRCode.toBuffer(uid, {
    type: "png",
    width: 300,
    margin: 1,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });

  // Save standalone QR code file
  const safeName = fullName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ .,'-]/g, "_").trim();
  writeFileSync(join(QR_DIR, `${uid}.png`), qrPngBuffer);

  // --- Embed QR into individual PDF page ---
  const pageIndex = FIRST_REAL_PAGE + i;

  // Create individual PDF with just this page
  const individualPdf = await PDFDocument.create();
  const [copiedPage] = await individualPdf.copyPages(pdfDoc, [pageIndex]);
  individualPdf.addPage(copiedPage);

  // Embed QR image into the individual PDF's page
  const qrImage = await individualPdf.embedPng(qrPngBuffer);
  const page = individualPdf.getPages()[0];
  page.drawImage(qrImage, {
    x: QR_X,
    y: QR_Y,
    width: QR_SIZE,
    height: QR_SIZE,
  });

  // Save individual PDF
  const individualBytes = await individualPdf.save();
  writeFileSync(join(INDIVIDUAL_DIR, `${safeName}.pdf`), individualBytes);

  // Also copy page into combined PDF (with QR embedded)
  const combinedCopy = await PDFDocument.create();
  const [combinedPage] = await combinedCopy.copyPages(pdfDoc, [pageIndex]);
  combinedCopy.addPage(combinedPage);
  const combinedQr = await combinedCopy.embedPng(qrPngBuffer);
  combinedCopy.getPages()[0].drawImage(combinedQr, {
    x: QR_X,
    y: QR_Y,
    width: QR_SIZE,
    height: QR_SIZE,
  });
  const [finalPage] = await combinedPdf.copyPages(combinedCopy, [0]);
  combinedPdf.addPage(finalPage);

  console.log(`  [${i + 1}/${count}] ${fullName} → ${uid}`);
}

// Save combined PDF
const combinedBytes = await combinedPdf.save();
writeFileSync(join(OUTPUT_DIR, "all-badges.pdf"), combinedBytes);

console.log(`\nDone!`);
console.log(`  Individual PDFs: ${INDIVIDUAL_DIR}/`);
console.log(`  QR code PNGs:    ${QR_DIR}/`);
console.log(`  Combined PDF:    ${join(OUTPUT_DIR, "all-badges.pdf")}`);
console.log(`  UIDs written to NAMES sheet in spreadsheet.`);
