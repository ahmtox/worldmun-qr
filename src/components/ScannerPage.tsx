"use client";

import { useCallback, useRef, useState } from "react";
import { EventName, ScanResponse } from "@/lib/types";
import EventSelector from "./EventSelector";
import QrScanner from "./QrScanner";
import ResultModal from "./ResultModal";

export default function ScannerPage() {
  const [selectedEvent, setSelectedEvent] = useState<EventName>("EVENT_1");
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const processingRef = useRef(false);
  const selectedEventRef = useRef(selectedEvent);
  selectedEventRef.current = selectedEvent;

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setIsLoading(true);

      try {
        const res = await fetch("/worldmun-qr/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: decodedText.trim(), event: selectedEventRef.current }),
        });
        const data: ScanResponse = await res.json();
        setScanResult(data);
        setIsModalOpen(true);
      } catch {
        setScanResult({
          success: false,
          error: "Network error. Please try again.",
        });
        setIsModalOpen(true);
      } finally {
        setIsLoading(false);
      }
      // NOTE: processingRef stays true until modal is dismissed
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setScanResult(null);
    processingRef.current = false;
  }, []);

  return (
    <div className="flex flex-col gap-5 mt-5">
      <EventSelector value={selectedEvent} onChange={setSelectedEvent} />
      <QrScanner onScan={handleScan} isLoading={isLoading} />
      <ResultModal
        result={scanResult}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
