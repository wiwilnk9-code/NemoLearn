"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Layers } from "lucide-react";

export const FinalCtaSection: React.FC = () => {
  return (
    <section className="py-20 sm:py-24 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#15803D] via-[#166534] to-[#052E16] text-white p-8 sm:p-12 md:p-16 shadow-lg">
          {/* Decorative ambient elements */}
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-16 w-64 h-64 rounded-full bg-[#84CC16]/15 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#86EFAC] text-xs font-bold tracking-tight">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Akses Belajar Mandiri Kurikulum SMA</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-white">
              Siap Tingkatkan Pemahaman Belajarmu Hari Ini?
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed max-w-2xl mx-auto">
              Mulai latihan gratis tanpa kartu kredit. Kuasai materi SMA, latih daya nalar HOTS, dan taklukkan evaluasi akademik dengan percaya diri.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-[#15803D] hover:bg-[#F0FDF4] font-bold text-base shadow-sm transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Coba Gratis Sekarang</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <Link
                href="/bank-soal"
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-semibold text-base transition-all duration-150 flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>Jelajahi Bank Soal</span>
              </Link>
            </div>

            <p className="text-xs text-white/70 pt-2">
              Tidak dipungut biaya pendaftaran &bull; Langsung bisa digunakan oleh siswa SMA
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
