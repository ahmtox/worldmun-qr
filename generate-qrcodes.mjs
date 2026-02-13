import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import QRCode from "qrcode";
import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { createCanvas, loadImage } from "canvas";

const creds = JSON.parse(readFileSync("sa.json", "utf8"));
const auth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SHEET_ID = "1vzz-LSSeFGscHZesKoR8RzdteKPiGl5ILq2Uni6uPuo";
const OUTPUT_DIR = join(import.meta.dirname, "qrcodes");

mkdirSync(OUTPUT_DIR, { recursive: true });

const doc = new GoogleSpreadsheet(SHEET_ID, auth);
await doc.loadInfo();

const sheet = doc.sheetsByTitle["DELEGATES"];
const rows = await sheet.getRows();

const uids = rows
  .map((r) => r.get("QR_UID"))
  .filter((uid) => uid && uid.trim().length > 0);

console.log(`Found ${uids.length} UIDs. Generating QR codes...`);

let count = 0;
for (const uid of uids) {
  const filePath = join(OUTPUT_DIR, `${uid}.png`);

  // Generate QR to a temp buffer first
  const qrBuffer = await QRCode.toBuffer(uid, {
    type: "png",
    width: 400,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  const qrImg = await loadImage(qrBuffer);

  const padding = 20;
  const textHeight = 40;
  const canvasWidth = qrImg.width + padding * 2;
  const canvasHeight = qrImg.height + padding * 2 + textHeight;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // White background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw QR code
  ctx.drawImage(qrImg, padding, padding);

  // Draw UID text below
  ctx.fillStyle = "#000000";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(uid, canvasWidth / 2, qrImg.height + padding + textHeight - 8);

  // Write final image
  writeFileSync(filePath, canvas.toBuffer("image/png"));

  count++;
  if (count % 50 === 0) console.log(`  Generated ${count}/${uids.length}...`);
}

console.log(`Done! Generated ${count} QR codes in ${OUTPUT_DIR}`);
