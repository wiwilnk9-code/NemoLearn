"use client";

import React from "react";
import { Check, X, ShieldCheck } from "lucide-react";

export const ComparisonSection: React.FC = () => {
  const comparisonItems = [
    {
      aspect: "Pondasi Pemahaman",
      traditional: "Hafalan rumus instan cepat lupa",
      nemolearn: "First-principles: memahami logika di balik rumus",
    },
    {
      aspect: "Model Penilaian",
      traditional: "Persentase benar mentah tanpa bobot soal",
      nemolearn: "Kalibrasi IRT 3-PL berskala nasional 200–1.000",
    },
    {
      aspect: "Penyajian Formula",
      traditional: "Gambar statis buram yang sulit dibaca di HP",
      nemolearn: "Rendering KaTeX vektor jernih di semua ukuran layar",
    },
    {
      aspect: "Pendekatan Pembahasan",
      traditional: "Langsung membocorkan kunci jawaban A–E",
      nemolearn: "Petunjuk Sokratik bertahap melatih alur berpikir",
    },
    {
      aspect: "Variasi Butir Soal",
      traditional: "Soal statis yang sering dihafal urutan pilihannya",
      nemolearn: "Modul adaptif variatif berbasis Kurikulum Merdeka",
    },
  ];

  return (
    <section id="keunggulan" className="py-20 sm:py-24 bg-[#F4F4F0] border-y border-[#E2E0D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#15803D]">
            Mengapa NemoLearn?
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-2 mb-4 leading-tight">
            Perbandingan Nyata: Hafalan vs Pemahaman Konseptual
          </h2>
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed">
            Menghadapi soal HOTS dan UTBK membutuhkan pondasi analitis yang tangguh. Lihat bagaimana NemoLearn mengubah caramu berlatih.
          </p>
        </div>

        {/* Comparison Matrix Table */}
        <div className="bg-white rounded-2xl border border-[#E2E0D8] shadow-xs overflow-hidden max-w-4xl mx-auto">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-[#FAF9F5] border-b border-[#E2E0D8] p-4 sm:p-5 text-xs font-bold uppercase tracking-wider">
            <div className="col-span-4 sm:col-span-4 text-[#64748B]">Dimensi Pembelajaran</div>
            <div className="col-span-4 sm:col-span-4 text-[#94A3B8]">Metode Konvensional</div>
            <div className="col-span-4 sm:col-span-4 text-[#15803D] flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>NemoLearn</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-[#E2E0D8]">
            {comparisonItems.map((item, idx) => (
              <div
                key={item.aspect}
                className={`grid grid-cols-12 p-4 sm:p-5 text-xs sm:text-sm items-center transition-colors ${
                  idx % 2 === 0 ? "bg-white" : "bg-[#FAF9F5]/40"
                }`}
              >
                <div className="col-span-4 font-bold text-[#0F172A] pr-2">
                  {item.aspect}
                </div>
                <div className="col-span-4 text-[#64748B] flex items-start gap-2 pr-2">
                  <X className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                  <span>{item.traditional}</span>
                </div>
                <div className="col-span-4 text-[#0F172A] font-semibold flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                  <span className="text-[#15803D]">{item.nemolearn}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
