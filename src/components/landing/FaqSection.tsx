"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Apa itu NemoLearn?",
      a: "NemoLearn adalah platform latihan soal mandiri dan simulasi ujian AI untuk pelajar SMA. Dilengkapi bank soal Kurikulum Merdeka (Fase E dan Fase F), penulisan rumus KaTeX presisi, penilaian terkalibrasi IRT 3-PL, dan pembahasan konseptual bertahap.",
    },
    {
      q: "Siapa yang dapat menggunakan NemoLearn?",
      a: "NemoLearn dirancang khusus untuk siswa SMA kelas 10, 11, dan 12 (rumpun Saintek, Soshum, maupun Umum), pejuang UTBK-SNBT, serta guru yang ingin mengelola dan memantau mutu butir latihan mandiri siswa.",
    },
    {
      q: "Apakah NemoLearn gratis?",
      a: "Ya. Siswa dapat membuat akun dan langsung mengerjakan latihan soal mandiri serta mengakses bank soal dasar Kurikulum Merdeka secara gratis tanpa perlu kartu kredit.",
    },
    {
      q: "Bagaimana cara membuat latihan soal baru?",
      a: "Cukup masuk ke menu Generator atau klik 'Buat Latihan', pilih mata pelajaran yang ingin dipelajari (misalnya Matematika atau Fisika), tentukan topik materi dan jumlah soal (5–20 butir), lalu pilih mode standar atau tantangan HOTS.",
    },
    {
      q: "Apakah NemoLearn dapat digunakan melalui smartphone (HP)?",
      a: "Tentu. Antarmuka NemoLearn sepenuhnya responsif dan dirancang dengan target sentuh ergonomis. Rumus matematika dan sains KaTeX tampil tajam di browser HP tanpa ada teks terpotong atau horizontal overflow.",
    },
    {
      q: "Bagaimana sistem penilaian IRT (Item Response Theory) bekerja?",
      a: "NemoLearn menggunakan model kalibrasi IRT 3-Parameter Logistic (3-PL). Nilai tidak hanya dihitung dari persentase jawaban benar, melainkan mempertimbangkan tingkat kesulitan soal, daya beda butir, dan kemungkinan tebakan. Rentang skor terkalibrasi pada skala standar nasional 200–1.000.",
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 sm:py-24 bg-[#FAF9F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#15803D]">
            Pertanyaan Umum
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-2 mb-3 leading-tight">
            Semua yang Perlu Kamu Ketahui
          </h2>
          <p className="text-base text-[#475569]">
            Jawaban transparan seputar fitur, kurikulum, dan pemanfaatan NemoLearn.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-[#E2E0D8] overflow-hidden transition-all duration-150"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D]"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-[#0F172A]">
                    {faq.q}
                  </span>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200",
                      isOpen
                        ? "bg-[#15803D] text-white rotate-180"
                        : "bg-[#FAF9F5] text-[#64748B] border border-[#E2E0D8]"
                    )}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-[#F3F4EE] pt-4 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
