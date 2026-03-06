"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  isLoading: boolean;
}

declare global {
  interface Window {
    BarcodeDetector: new (options: { formats: string[] }) => {
      detect: (source: HTMLVideoElement | HTMLCanvasElement) => Promise<{ rawValue: string }[]>;
    };
  }
}

export default function QrScanner({ onScan, isLoading }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);
  const [scannerType, setScannerType] = useState<string>("");

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function start() {
      const hasNative = "BarcodeDetector" in window;
      setScannerType(hasNative ? "native" : "jsqr");

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
      } catch {
        setError("Camera access denied. Please allow camera permissions and reload.");
        return;
      }

      if (stopped || !videoRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();

      if (hasNative) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

        // Sequential loop — wait for detect() to finish before trying again
        async function scanLoop() {
          while (!stopped) {
            try {
              const results = await detector.detect(video);
              if (results.length > 0 && !stopped) {
                onScanRef.current(results[0].rawValue);
              }
            } catch {
              // frame not ready
            }
            // Brief yield so we don't block the UI thread
            await new Promise((r) => { timeoutId = setTimeout(r, 50); });
          }
        }
        scanLoop();
      } else {
        // Fallback: jsQR at reduced resolution
        const jsQR = (await import("jsqr")).default;
        const SCAN_W = 480;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

        async function scanLoop() {
          while (!stopped) {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              // Scale down for faster processing
              const scale = SCAN_W / video.videoWidth;
              canvas.width = SCAN_W;
              canvas.height = Math.round(video.videoHeight * scale);
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const result = jsQR(imageData.data, canvas.width, canvas.height);
              if (result && !stopped) {
                onScanRef.current(result.data);
              }
            }
            await new Promise((r) => { timeoutId = setTimeout(r, 80); });
          }
        }
        scanLoop();
      }
    }

    start();

    return () => {
      stopped = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
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
      {scannerType && (
        <div className="absolute top-2 right-2 text-[10px] text-gray-500 bg-black/50 px-1.5 py-0.5 rounded">
          {scannerType}
        </div>
      )}
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
