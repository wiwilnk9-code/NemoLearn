"use client";

import React from "react";
import { BookMarked, SlidersHorizontal, Edit3, Award } from "lucide-react";

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: "01",
      icon: BookMarked,
      title: "Pilih Mata Pelajaran",
      description:
        "Tentukan mata pelajaran dan topik bahasan yang ingin dikuasai, mulai dari Aljabar Kalkulus hingga Kinematika Fisika atau Akuntansi SMA.",
    },
    {
      num: "02",
      icon: SlidersHorizontal,
      title: "Sesuaikan Preferensi",
      description:
        "Atur jumlah soal latihan (5 hingga 20 butir) serta pilih mode standar atau tantangan Higher-Order Thinking Skills (HOTS).",
    },
    {
      num: "03",
      icon: Edit3,
      title: "Kerjakan Latihan Mandiri",
      description:
        "Masuki ruang latihan dengan notasi rumus KaTeX beresolusi tinggi, navigasi soal yang fleksibel, dan panduan konsep bertahap.",
    },
    {
      num: "04",
      icon: Award,
      title: "Evaluasi IRT & Pembahasan",
      description:
        "Dapatkan kalibrasi nilai berskala 200–1.000, analisis akurasi per topik, serta uraian solusi komprehensif untuk penguatan pemahaman.",
    },
  ];

  return (
    <section id="cara-kerja" className="py-20 sm:py-24 bg-[#F4F4F0] border-y border-[#E2E0D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#15803D]">
            Alur Terstruktur
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-2 mb-3 leading-tight">
            4 Langkah Mudah Menguasai Materi Ujian
          </h2>
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed">
            Pengalaman belajar linear dan terarah tanpa membuang waktu dengan antarmuka yang rumit.
          </p>
        </div>

        {/* 4 Steps Progressive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const IconComponent = step.icon;

            return (
              <div
                key={step.num}
                className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E2E0D8] hover:border-[#15803D] hover:shadow-xs transition-all duration-200 flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-10 h-10 rounded-full bg-[#15803D] text-white font-bold flex items-center justify-center text-sm shadow-2xs">
                      {step.num}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#FAF9F5] text-[#64748B] group-hover:text-[#15803D] flex items-center justify-center transition-colors">
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-[#F3F4EE] flex items-center justify-between text-[11px] text-[#64748B]">
                  <span>Tahap {idx + 1} dari 4</span>
                  <span className="text-[#15803D] font-bold">&rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
