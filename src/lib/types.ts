export const EVENT_NAMES = [
  "EVENT_1",
  "EVENT_2",
  "EVENT_3",
  "EVENT_4",
  "EVENT_5",
  "EVENT_6",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export interface ScanRequest {
  uid: string;
  event: EventName;
}

export interface ScanSuccessResponse {
  success: true;
  groupName: string;
  email: string;
  qrUid: string;
  event: EventName;
  previousCount: number;
}

export interface ScanErrorResponse {
  success: false;
  error: string;
}

export type ScanResponse = ScanSuccessResponse | ScanErrorResponse;
