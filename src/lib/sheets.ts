import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

let docInstance: GoogleSpreadsheet | null = null;

const FIXED_COLUMNS = new Set([
  "IDENTIFIER",
  "DELEGATION",
  "EMAIL",
  "NAME",
  "QR_UID",
  "QR_URL",
  "Social Package",
]);

async function getDoc(): Promise<GoogleSpreadsheet> {
  if (docInstance) return docInstance;

  const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(process.env.SHEET_ID!, auth);
  await doc.loadInfo();
  docInstance = doc;
  return doc;
}

export async function getEventColumns(): Promise<string[]> {
  const doc = await getDoc();

  const delegatesSheet = doc.sheetsByTitle["DELEGATES"];
  if (!delegatesSheet) {
    throw new Error("DELEGATES sheet not found");
  }

  await delegatesSheet.loadHeaderRow();
  const headers = delegatesSheet.headerValues;

  // Event columns are everything that isn't a fixed column
  return headers.filter((h) => !FIXED_COLUMNS.has(h));
}

export async function lookupAndIncrement(
  uid: string,
  event: string
): Promise<{
  name: string;
  delegation: string;
  email: string;
  qrUid: string;
  event: string;
  previousCount: number;
}> {
  const doc = await getDoc();

  // 1. Look up delegate by QR_UID
  const delegatesSheet = doc.sheetsByTitle["DELEGATES"];
  if (!delegatesSheet) {
    throw new Error("DELEGATES sheet not found");
  }

  // Validate that the event column actually exists in the sheet
  await delegatesSheet.loadHeaderRow();
  if (!delegatesSheet.headerValues.includes(event)) {
    throw new Error("Invalid event: column not found in sheet");
  }

  const delegateRows = await delegatesSheet.getRows();
  const delegateRow = delegateRows.find(
    (row) => row.get("QR_UID") === uid
  );

  if (!delegateRow) {
    throw new Error("UID not found");
  }

  // 2. Check eligibility for the event
  const eligible = delegateRow.get(event);
  if (eligible !== "TRUE" && eligible !== true) {
    throw new Error("Not eligible for this event");
  }

  const email = delegateRow.get("EMAIL") || "";
  const name = delegateRow.get("NAME") || "";
  const delegation = delegateRow.get("DELEGATION") || "";

  // 3. Find attendance row and increment counter
  const attendanceSheet = doc.sheetsByTitle["ATTENDANCE"];
  if (!attendanceSheet) {
    throw new Error("ATTENDANCE sheet not found");
  }

  // Validate the event column exists in ATTENDANCE too
  await attendanceSheet.loadHeaderRow();
  if (!attendanceSheet.headerValues.includes(event)) {
    throw new Error("Event column not found in ATTENDANCE sheet");
  }

  const attendanceRows = await attendanceSheet.getRows();
  const attendanceRow = attendanceRows.find(
    (row) => row.get("QR_UID") === uid
  );

  if (!attendanceRow) {
    throw new Error("Attendance row not found for this delegate");
  }

  const currentValue = attendanceRow.get(event);
  const previousCount = parseInt(currentValue, 10) || 0;

  attendanceRow.set(event, previousCount + 1);
  await attendanceRow.save();

  return {
    name,
    delegation,
    email,
    qrUid: uid,
    event,
    previousCount,
  };
}
