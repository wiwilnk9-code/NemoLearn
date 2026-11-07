"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-[#F4F4F0] border-t border-[#E2E0D8] text-[#475569]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 mb-12">
          {/* Brand Col (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="#hero" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#15803D] text-white flex items-center justify-center shadow-2xs">
                <GraduationCap className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-[#0F172A]">
                Nemo<span className="text-[#15803D]">Learn</span>
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-sm">
              Platform latihan mandiri dan evaluasi terpadu untuk siswa SMA. Menggabungkan kurikulum nasional, notasi rumus KaTeX presisi, penilaian IRT 3-PL, dan bimbingan Sokratik bertahap.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-[#0F172A]">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span className="font-medium">Status Sistem: Normal (Server Jakarta-1)</span>
            </div>
          </div>

          {/* Col 2: Kurikulum SMA */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Kurikulum SMA
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/generator?subject=matematika" className="hover:text-[#15803D] transition-colors">
                  Matematika SMA
                </Link>
              </li>
              <li>
                <Link href="/generator?subject=fisika" className="hover:text-[#15803D] transition-colors">
                  Fisika Terapan
                </Link>
              </li>
              <li>
                <Link href="/generator?subject=kimia" className="hover:text-[#15803D] transition-colors">
                  Kimia Analitis
                </Link>
              </li>
              <li>
                <Link href="/generator?subject=biologi" className="hover:text-[#15803D] transition-colors">
                  Biologi Sel &amp; Genetika
                </Link>
              </li>
              <li>
                <Link href="/generator?subject=ekonomi" className="hover:text-[#15803D] transition-colors">
                  Ekonomi &amp; Akuntansi
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Simulasi & Fitur */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Latihan &amp; Bank Soal
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/bank-soal" className="hover:text-[#15803D] transition-colors">
                  Jelajahi Bank Soal
                </Link>
              </li>
              <li>
                <Link href="/generator" className="hover:text-[#15803D] transition-colors">
                  Generator Soal AI
                </Link>
              </li>
              <li>
                <a href="#cara-kerja" className="hover:text-[#15803D] transition-colors">
                  Alur Latihan Mandiri
                </a>
              </li>
              <li>
                <a href="#showcase" className="hover:text-[#15803D] transition-colors">
                  Simulasi Ruang Ujian
                </a>
              </li>
              <li>
                <a href="#keunggulan" className="hover:text-[#15803D] transition-colors">
                  Metode Penilaian IRT
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Panduan & Bantuan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
              Bantuan &amp; Legal
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/help" className="hover:text-[#15803D] transition-colors">
                  Pusat Bantuan &amp; FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#15803D] transition-colors">
                  Ketentuan Layanan
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#15803D] transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#15803D] transition-colors">
                  Masuk Akun
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#15803D] transition-colors font-semibold text-[#15803D]">
                  Daftar Siswa Baru
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 border-t border-[#E2E0D8] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <p>
            &copy; 2026 NemoLearn Indonesia. Seluruh hak cipta dilindungi undang-undang.
          </p>
          <p className="text-[11px]">
            Platform Persiapan Ujian Akademik SMA &bull; Kurikulum Merdeka 2026
          </p>
        </div>
      </div>
    </footer>
  );
};
