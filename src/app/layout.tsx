import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const inter = localFont({
  src: "../fonts/Inter.woff2",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WorldMUN Attendance",
  description: "QR Code attendance tracking for WorldMUN conference",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/worldmun-logo.webp`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-gray-950 text-white min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
