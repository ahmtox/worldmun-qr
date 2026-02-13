import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { EventName } from "./types";

let docInstance: GoogleSpreadsheet | null = null;

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

export async function lookupAndIncrement(
  uid: string,
  event: EventName
): Promise<{
  groupName: string;
  email: string;
  qrUid: string;
  event: EventName;
  previousCount: number;
}> {
  const doc = await getDoc();

  // 1. Look up delegate by QR_UID
  const delegatesSheet = doc.sheetsByTitle["DELEGATES"];
  if (!delegatesSheet) {
    throw new Error("DELEGATES sheet not found");
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

  const email = delegateRow.get("EMAIL");
  const groupName = delegateRow.get("GROUP_NAME");

  // 3. Find attendance row and increment counter
  const attendanceSheet = doc.sheetsByTitle["ATTENDANCE"];
  if (!attendanceSheet) {
    throw new Error("ATTENDANCE sheet not found");
  }

  const attendanceRows = await attendanceSheet.getRows();
  const attendanceRow = attendanceRows.find(
    (row) => row.get("EMAIL") === email
  );

  if (!attendanceRow) {
    throw new Error("Attendance row not found for this delegate");
  }

  const currentValue = attendanceRow.get(event);
  const previousCount = parseInt(currentValue, 10) || 0;

  attendanceRow.set(event, previousCount + 1);
  await attendanceRow.save();

  return {
    groupName,
    email,
    qrUid: uid,
    event,
    previousCount,
  };
}
