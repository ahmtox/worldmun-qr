"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScanResponse } from "@/lib/types";
import EventSelector from "./EventSelector";
import QrScanner from "./QrScanner";
import ResultModal from "./ResultModal";

export default function ScannerPage() {
  const [events, setEvents] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const selectedEventRef = useRef(selectedEvent);
  selectedEventRef.current = selectedEvent;

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/worldmun-qr/api/events");
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
          setSelectedEvent(data.events[0]);
        } else {
          setEventsError("No event columns found in the sheet.");
        }
      } catch {
        setEventsError("Failed to load events. Please reload.");
      } finally {
        setEventsLoading(false);
      }
    }
    loadEvents();
  }, []);

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
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setScanResult(null);
    processingRef.current = false;
  }, []);

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center mt-10 text-gray-400">
        Loading events...
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="mt-5 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
        {eventsError}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 mt-5">
      <EventSelector events={events} value={selectedEvent} onChange={setSelectedEvent} />
      <QrScanner onScan={handleScan} isLoading={isLoading} />
      <ResultModal
        result={scanResult}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
