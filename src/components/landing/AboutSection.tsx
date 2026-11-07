"use client";

import React from "react";
import { BookOpen, RefreshCw, BarChart3, ArrowRight } from "lucide-react";
import Link from "next/link";

export const AboutSection: React.FC = () => {
  const pillars = [
    {
      icon: BookOpen,
      iconBg: "bg-[#F0FDF4] text-[#15803D]",
      tag: "Saintek & Soshum Selaras",
      title: "Penguasaan Konsep Mendalam",
      description:
        "Tiap butir latihan membongkar postulat dasar fisika, kimia, biologi, matematika, hingga literasi sosial. Siswa memahami mengapa suatu rumus berlaku, bukan sekadar menghafal trik cepat.",
    },
    {
      icon: RefreshCw,
      iconBg: "bg-[#FFF7ED] text-[#EA580C]",
      tag: "Variasi HOTS Dinamis",
      title: "Soal Adaptif Tanpa Hapal Buta",
      description:
        "Algoritma pembuatan latihan secara cerdas memvariasikan skenario soal, parameter numerik, dan sudut pandang stimulus, melatih fleksibilitas berpikir saat menghadapi ujian baru.",
    },
    {
      icon: BarChart3,
      iconBg: "bg-[#EFF6FF] text-[#1D4ED8]",
      tag: "Diagnostik IRT 3-PL",
      title: "Analisis Kelemahan Berbasis Data",
      description:
        "Alih-alih hanya menampilkan persentase benar-salah biasa, evaluasi mengidentifikasi sub-topik spesifik yang masih rapuh sehingga jam belajar terfokus pada materi yang paling krusial.",
    },
  ];

  return (
    <section id="tentang" className="py-20 sm:py-24 bg-[#F4F4F0] border-y border-[#E2E0D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Block */}
        <div className="max-w-3xl mb-14 text-left">
          <span className="text-xs font-bold uppercase tracking-wider text-[#15803D]">
            Filosofi Pembelajaran SMA
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-2 mb-4 leading-tight">
            Bukan Sekadar Hapal Trik, Tapi Memahami Struktur Sains &amp; Logika.
          </h2>
          <p className="text-base sm:text-lg text-[#475569] leading-relaxed">
            Siswa SMA di era Kurikulum Merdeka dihadapkan pada soal penalaran tinggi (HOTS) serta seleksi UTBK-SNBT yang menuntut pemahaman konsep utuh. NemoLearn dirancang dari bawah untuk menjembatani kesenjangan antara teori buku pelajaran dan standar pengujian nasional.
          </p>
        </div>

        {/* 3 Interactive Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => {
            const IconComponent = pillar.icon;

            return (
              <div
                key={pillar.title}
                className="bg-white p-7 sm:p-8 rounded-2xl border border-[#E2E0D8] hover:border-[#15803D] hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl ${pillar.iconBg} flex items-center justify-center mb-6 shadow-2xs`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A] mb-2.5">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-[#475569] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4EE] flex items-center justify-between text-xs font-semibold text-[#15803D]">
                  <span>{pillar.tag}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
