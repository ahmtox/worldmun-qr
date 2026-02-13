"use client";

import { useEffect } from "react";
import { ScanResponse } from "@/lib/types";

interface ResultModalProps {
  result: ScanResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResultModal({ result, isOpen, onClose }: ResultModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  const isSuccess = result.success;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-2xl border-2 ${
          isSuccess ? "border-green-500" : "border-red-500"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Status icon */}
        <div className="flex justify-center mb-4">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className={`text-center text-xl font-bold mb-4 ${isSuccess ? "text-green-400" : "text-red-400"}`}>
          {isSuccess ? "SCAN RECORDED" : "SCAN FAILED"}
        </h2>

        {/* Details */}
        {result.success ? (
          <div className="space-y-2 text-sm">
            <DetailRow label="Group" value={result.groupName} />
            <DetailRow label="Email" value={result.email} />
            <DetailRow label="UID" value={result.qrUid} />
            <DetailRow label="Event" value={result.event} />
            <DetailRow
              label="Previous scans"
              value={String(result.previousCount)}
            />
          </div>
        ) : (
          <p className="text-center text-gray-300 text-sm">{result.error}</p>
        )}

        {/* Dismiss button */}
        <button
          onClick={onClose}
          className={`w-full mt-6 py-3 px-6 text-lg font-semibold rounded-lg transition-colors ${
            isSuccess
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {isSuccess ? "Scan Next" : "Try Again"}
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-800">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}
