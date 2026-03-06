"use client";

interface EventSelectorProps {
  events: string[];
  value: string;
  onChange: (event: string) => void;
}

export default function EventSelector({ events, value, onChange }: EventSelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="event-select" className="text-sm font-medium text-gray-400">
        Select Event
      </label>
      <select
        id="event-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-3 px-4 text-lg bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[var(--color-brand-gold)] transition-colors"
      >
        {events.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
