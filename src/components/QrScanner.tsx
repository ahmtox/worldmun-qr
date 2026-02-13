"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  isLoading: boolean;
}

export default function QrScanner({ onScan, isLoading }: QrScannerProps) {
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let html5Qrcode: InstanceType<typeof import("html5-qrcode").Html5Qrcode> | null = null;
    let stopped = false;

    async function startScanner() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (stopped) return;

      html5Qrcode = new Html5Qrcode("qr-reader");

      try {
        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onScanRef.current(decodedText);
          },
          () => {}
        );
      } catch {
        setError(
          "Camera access denied. Please allow camera permissions and reload the page."
        );
      }
    }

    startScanner();

    return () => {
      stopped = true;
      if (html5Qrcode) {
        html5Qrcode.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="relative">
      <div id="qr-reader" className="w-full rounded-lg overflow-hidden bg-gray-900" />
      {error && (
        <div className="mt-2 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
          <div className="text-white text-lg font-semibold animate-pulse">
            Processing...
          </div>
        </div>
      )}
    </div>
  );
}
