"use client";

import { useEffect, useRef, useState } from "react";

interface QrScannerProps {
  onScan: (decodedText: string) => void;
  isLoading: boolean;
}

declare global {
  interface Window {
    BarcodeDetector: new (options: { formats: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
    };
  }
}

export default function QrScanner({ onScan, isLoading }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let rafId: number | null = null;

    async function start() {
      const hasNative = "BarcodeDetector" in window;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
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

        async function scanNative() {
          if (stopped) return;
          try {
            const results = await detector.detect(video);
            if (results.length > 0) {
              onScanRef.current(results[0].rawValue);
            }
          } catch {
            // frame not ready, retry
          }
          if (!stopped) rafId = requestAnimationFrame(scanNative);
        }
        rafId = requestAnimationFrame(scanNative);
      } else {
        // Fallback: jsQR (pure JS decoder)
        const jsQR = (await import("jsqr")).default;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

        function scanFallback() {
          if (stopped) return;
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const result = jsQR(imageData.data, canvas.width, canvas.height);
            if (result) {
              onScanRef.current(result.data);
            }
          }
          if (!stopped) rafId = requestAnimationFrame(scanFallback);
        }
        rafId = requestAnimationFrame(scanFallback);
      }
    }

    start();

    return () => {
      stopped = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
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
