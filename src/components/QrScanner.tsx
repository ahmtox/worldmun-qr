"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  isLoading: boolean;
}

export default function QrScanner({ onScan, isLoading }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let scanner: import("qr-scanner").default | null = null;

    async function start() {
      const QrScanner = (await import("qr-scanner")).default;

      if (!videoRef.current) return;

      scanner = new QrScanner(
        videoRef.current,
        (result) => {
          onScanRef.current(result.data);
        },
        {
          preferredCamera: "environment",
          highlightScanRegion: false,
          highlightCodeOutline: false,
          maxScansPerSecond: 25,
        }
      );

      try {
        await scanner.start();
      } catch {
        setError("Camera access denied. Please allow camera permissions and reload.");
      }
    }

    start();

    return () => {
      if (scanner) {
        scanner.stop();
        scanner.destroy();
      }
    };
  }, []);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full rounded-lg bg-gray-900"
        playsInline
        muted
      />
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
