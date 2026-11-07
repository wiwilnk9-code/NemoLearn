"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "@/types/user";

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, [pathname]);

  // Hide footer on admin panel, practice room, login, and guest landing page
  // On SSR and initial client hydration, currentUser is null, so for pathname === "/" it consistently returns null
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/practice") ||
    pathname === "/login" ||
    (pathname === "/" && !currentUser)
  ) {
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
