"use client";

import React from "react";
import {
  Sparkles,
  Zap,
  Variable,
  BarChart2,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { MathRenderer } from "@/components/MathRenderer";

export const FeaturesSection: React.FC = () => {
  return (
    <section id="fitur" className="py-20 sm:py-24 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
            Instrumen &amp; Kemampuan Nyata
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-2 mb-4 leading-tight">
            Dirancang Khusus untuk Ambisi Akademik Pelajar SMA
          </h2>
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed">
            5 instrumen terintegrasi yang menghadirkan standar simulasi latihan sekelas evaluasi nasional dan seleksi masuk perguruan tinggi.
          </p>
        </div>

        {/* Bento Grid 5 Fitur */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Fitur 1: AI Curated Kurikulum Merdeka (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-[#E2E0D8] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-[#15803D] hover:shadow-xs transition-all">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F0FDF4] text-xs font-bold text-[#15803D] mb-4 border border-[#BBF7D0]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Fase E (Kelas 10) &amp; Fase F (Kelas 11–12)</span>
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                1. Pembuatan Latihan AI Berbasis Kurikulum Merdeka SMA
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed mb-6">
                Modul generator cerdas terikat langsung dengan capaian pembelajaran resmi 9 mata pelajaran SMA: Matematika, Fisika, Biologi, Kimia, Ekonomi, Sosiologi, Geografi, hingga Literasi Bahasa. Soal relevan dengan silabus sekolah dan ujian kelulusan.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E2E0D8] flex flex-wrap gap-2 text-xs font-medium text-[#0F172A]">
              <span className="px-2.5 py-1 bg-white rounded-lg border border-[#E2E0D8]">Aljabar &amp; Kalkulus</span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-[#E2E0D8]">Kinematika &amp; Dinamika Vektor</span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-[#E2E0D8]">Stoikiometri &amp; Asam-Basa</span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-[#E2E0D8]">Genetika &amp; Biologi Sel</span>
              <span className="px-2.5 py-1 bg-white rounded-lg border border-[#E2E0D8]">Mekanisme Pasar &amp; Akuntansi</span>
            </div>
          </div>

          {/* Fitur 2: Standar & Tantangan HOTS (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-[#E2E0D8] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-[#EA580C] hover:shadow-xs transition-all">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#FFF7ED] text-xs font-bold text-[#EA580C] mb-4 border border-[#FED7AA]">
                <Zap className="w-3.5 h-3.5" />
                <span>Penalaran Tingkat Tinggi</span>
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">
                2. Mode Latihan Standar &amp; Tantangan HOTS
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Tingkatkan daya nalar kritis melalui soal-soal berbasis stimulus grafik, studi kasus kontemporer, dan relasi multi-variabel untuk persiapan olimpiade &amp; UTBK-SNBT.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E2E0D8]">
              <span className="text-xs text-[#64748B] font-medium">Distribusi Taraf Soal:</span>
              <span className="text-xs font-bold text-[#EA580C]">Tersedia Mode Standar &amp; Khusus HOTS</span>
            </div>
          </div>

          {/* Fitur 3: Notasi KaTeX Presisi (4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E0D8] rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#15803D] hover:shadow-xs transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center mb-4">
                <Variable className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">
                3. Notasi Rumus KaTeX Presisi
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mb-4">
                Rendering rumus matematika, fisika, dan kimia berbasis KaTeX berkecepatan tinggi. Tampilan jernih dan tajam di layar desktop maupun smartphone tanpa gambar buram.
              </p>
            </div>
            <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E2E0D8] text-center text-xs font-medium text-[#0F172A]">
              <MathRenderer text="\\[ \int_a^b f(x)\,dx = F(b) - F(a) \\]" />
            </div>
          </div>

          {/* Fitur 4: Penilaian IRT 3-PL (4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E0D8] rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#15803D] hover:shadow-xs transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center mb-4">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">
                4. Penilaian Terkalibrasi IRT Skala 200–1000
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mb-4">
                Mengukur parameter kemampuan siswa menggunakan model Item Response Theory (IRT) 3-PL. Menimbang tingkat kesulitan soal dan daya pembeda, persis model seleksi SNBT.
              </p>
            </div>
            <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E2E0D8] flex items-center justify-between text-xs">
              <span className="text-[#64748B]">Skala Skor Nasional:</span>
              <span className="font-bold text-[#15803D]">200 &mdash; 1.000 Poin</span>
            </div>
          </div>

          {/* Fitur 5: Pembahasan Sokratik Bertahap (4 Cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E0D8] rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#EA580C] hover:shadow-xs transition-all">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center mb-4">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">
                5. Pembahasan Sokratik Bertahap
              </h3>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mb-4">
                Setiap butir dilengkapi penalaran langkah-demi-langkah. Melatih alur berpikir ilmiah tanpa membocorkan opsi kunci jawaban di awal latihan.
              </p>
            </div>
            <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E2E0D8] flex items-center gap-2 text-xs font-semibold text-[#EA580C]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Kunci aman &amp; pembahasan konseptual</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
