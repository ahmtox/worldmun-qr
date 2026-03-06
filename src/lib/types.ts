export interface ScanRequest {
  uid: string;
  event: string;
}

export interface ScanSuccessResponse {
  success: true;
  name: string;
  delegation: string;
  email: string;
  qrUid: string;
  event: string;
  previousCount: number;
}

export interface ScanErrorResponse {
  success: false;
  error: string;
  scannedUid?: string;
}

export type ScanResponse = ScanSuccessResponse | ScanErrorResponse;
