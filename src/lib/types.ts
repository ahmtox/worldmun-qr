export interface ScanRequest {
  uid: string;
  event: string;
}

export interface ScanSuccessResponse {
  success: true;
  groupName: string;
  email: string;
  qrUid: string;
  event: string;
  previousCount: number;
}

export interface ScanErrorResponse {
  success: false;
  error: string;
}

export type ScanResponse = ScanSuccessResponse | ScanErrorResponse;
