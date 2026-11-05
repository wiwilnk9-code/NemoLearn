import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { ToastContainer } from "@/components/ui/Toast";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#16A34A",
};

export const metadata: Metadata = {
  title: "NemoLearn — Platform Latihan Soal & Kuis AI SMA",
  description: "Platform latihan mandiri pelajar SMA, pembuatan kuis terarah, penilaian otomatis, dan evaluasi terpadu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="flex flex-col lg:flex-row min-h-screen bg-[#FAF9F5] text-[#0F172A] font-sans antialiased overflow-x-hidden selection:bg-[#DCFCE7] selection:text-[#15803D]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
          <main className="flex-grow min-w-0">{children}</main>
          <Footer />
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
