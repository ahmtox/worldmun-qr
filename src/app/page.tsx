import Header from "@/components/Header";
import ScannerPage from "@/components/ScannerPage";

export default function Home() {
  return (
    <main className="max-w-lg mx-auto px-4 py-6 min-h-screen">
      <Header />
      <ScannerPage />
    </main>
  );
}
