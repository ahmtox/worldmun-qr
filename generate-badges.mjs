import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import QRCode from "qrcode";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { PDFDocument } from "pdf-lib";

// --- Config ---
const SHEET_ID = "1vzz-LSSeFGscHZesKoR8RzdteKPiGl5ILq2Uni6uPuo";
const BADGES_DIR = join(import.meta.dirname, "badges");
const IDENTIFIERS_DIR = join(BADGES_DIR, "identifiers");
const OUTPUT_DIR = join(BADGES_DIR, "output");
const QR_DIR = join(BADGES_DIR, "qrcodes");

const IDENTIFIERS = [
  "OBSERVER", "SOLO", "BATCH1", "BATCH2", "BATCH3", "BATCH4",
  "BATCH5", "BATCH6", "ASCHAIR", "SECRET", "COMMC", "FACADV",
];

// QR code placement: bottom-left yellow box
const QR_X = 20;
const QR_Y = 11;
const QR_SIZE = 76;

mkdirSync(OUTPUT_DIR, { recursive: true });
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

const delegatesSheet = doc.sheetsByTitle["DELEGATES"];
if (!delegatesSheet) {
  console.error('ERROR: No "DELEGATES" sheet found.');
  process.exit(1);
}

await delegatesSheet.loadHeaderRow();
console.log("DELEGATES headers:", delegatesSheet.headerValues);

const allRows = await delegatesSheet.getRows();
console.log(`Found ${allRows.length} total rows in DELEGATES sheet.\n`);

// --- Group rows by IDENTIFIER ---
const grouped = {};
for (const row of allRows) {
  const id = (row.get("IDENTIFIER") || "").trim();
  if (!id) continue;
  if (!grouped[id]) grouped[id] = [];
  grouped[id].push(row);
}

console.log("Rows per identifier:");
for (const [id, rows] of Object.entries(grouped)) {
  console.log(`  ${id}: ${rows.length} delegates`);
}
console.log();

// --- Process each identifier ---
for (const identifier of IDENTIFIERS) {
  const rows = grouped[identifier];
  if (!rows || rows.length === 0) {
    console.warn(`WARNING: No delegates found for ${identifier}, skipping.`);
    continue;
  }

  const pdfPath = join(IDENTIFIERS_DIR, `${identifier}.pdf`);
  if (!existsSync(pdfPath)) {
    console.warn(`WARNING: PDF not found at ${pdfPath}, skipping.`);
    continue;
  }

  const pdfBytes = readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const totalPages = pdfDoc.getPageCount();

  if (totalPages !== rows.length) {
    console.warn(
      `WARNING [${identifier}]: PDF has ${totalPages} pages but sheet has ${rows.length} delegates. ` +
      `Processing min(${Math.min(totalPages, rows.length)}).`
    );
  }

  const count = Math.min(totalPages, rows.length);
  const combinedPdf = await PDFDocument.create();

  console.log(`Processing ${identifier} (${count} badges)...`);

  for (let i = 0; i < count; i++) {
    const row = rows[i];
    const uid = (row.get("QR_UID") || "").trim();
    const name = row.get("NAME") || `Unknown_${i}`;

    if (!uid) {
      console.warn(`  WARNING: No QR_UID for row ${i + 1} (${name}), skipping.`);
      continue;
    }

    // Generate QR code PNG
    const qrPngBuffer = await QRCode.toBuffer(uid, {
      type: "png",
      width: 300,
      margin: 1,
      color: { dark: "#000000", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    });

    // Save standalone QR code image
    writeFileSync(join(QR_DIR, `${uid}.png`), qrPngBuffer);

    // Create a temp PDF with this page + QR overlay
    const tempPdf = await PDFDocument.create();
    const [copiedPage] = await tempPdf.copyPages(pdfDoc, [i]);
    tempPdf.addPage(copiedPage);

    const qrImage = await tempPdf.embedPng(qrPngBuffer);
    tempPdf.getPages()[0].drawImage(qrImage, {
      x: QR_X,
      y: QR_Y,
      width: QR_SIZE,
      height: QR_SIZE,
    });

    // Copy into combined PDF
    const [finalPage] = await combinedPdf.copyPages(tempPdf, [0]);
    combinedPdf.addPage(finalPage);

    console.log(`  [${i + 1}/${count}] ${name} -> ${uid}`);
  }

  // Save combined PDF for this identifier
  const combinedBytes = await combinedPdf.save();
  const outputPath = join(OUTPUT_DIR, `${identifier}-badges.pdf`);
  writeFileSync(outputPath, combinedBytes);
  console.log(`  -> Saved ${outputPath}\n`);
}

console.log("Done!");
console.log(`  QR code PNGs: ${QR_DIR}/`);
console.log(`  Badge PDFs:   ${OUTPUT_DIR}/`);
