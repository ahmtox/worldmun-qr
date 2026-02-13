export default function Header() {
  return (
    <div className="flex flex-col items-center gap-2 pb-4 border-b border-gray-800">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/worldmun-qr/worldmun-logo.webp"
        alt="WorldMUN"
        width={72}
        height={72}
      />
      <h1 className="text-xl font-semibold text-white tracking-tight">
        Attendance Scanner
      </h1>
    </div>
  );
}
