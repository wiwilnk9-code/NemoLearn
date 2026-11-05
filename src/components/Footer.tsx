"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  // Hide footer on admin panel and practice room
  if (pathname.startsWith("/admin") || pathname.startsWith("/practice")) {
    return null;
  }

  return (
    <footer className="border-t border-[#E5E7EB] bg-white py-6 text-center text-xs text-[#64748B] mb-16 lg:mb-0">
      <div className="max-w-7xl mx-auto px-4 space-y-2">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-xs font-medium text-[#475569]">
          <Link href="/terms" className="hover:text-[#16A34A] transition-colors">
            Ketentuan Layanan
          </Link>
          <span className="text-[#CBD5E1] hidden sm:inline">&bull;</span>
          <Link href="/privacy" className="hover:text-[#16A34A] transition-colors">
            Kebijakan Privasi
          </Link>
          <span className="text-[#CBD5E1] hidden sm:inline">&bull;</span>
          <Link href="/help" className="hover:text-[#16A34A] transition-colors">
            Pusat Bantuan & FAQ
          </Link>
        </div>
        <p className="font-semibold text-[#0F172A] pt-1">
          NemoLearn &copy; 2026 — Platform Latihan Soal SMA & Evaluasi Terpadu
        </p>
        <p className="text-[11px] text-[#64748B]">
          Belajar terarah &bull; Latihan mandiri &bull; Pemahaman konsep mendalam Kurikulum Merdeka
        </p>
      </div>
    </footer>
  );
};
