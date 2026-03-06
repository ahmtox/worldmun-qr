export interface ScanRequest {
  uid: string;
  event: string;
}

export interface DelegateInfo {
  name: string;
  delegation: string;
  email: string;
  qrUid: string;
}

export interface ScanSuccessResponse {
  success: true;
  name: string;
  delegation: string;
  email: string;
  qrUid: string;
  event: string;
  accessType: string;
  previousCount: number;
}

export interface ScanErrorResponse {
  success: false;
  error: string;
  scannedUid?: string;
  delegate?: DelegateInfo;
}

export type ScanResponse = ScanSuccessResponse | ScanErrorResponse;
