"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  Lightbulb,
  Check,
  TrendingUp,
} from "lucide-react";
import { MathRenderer } from "@/components/MathRenderer";
import { cn } from "@/lib/utils";

export const HeroSection: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>("B");
  const [showExplanation, setShowExplanation] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const options = [
    { key: "A", text: "3,2 m/s²", isCorrect: false },
    { key: "B", text: "4,0 m/s²", isCorrect: true },
    { key: "C", text: "4,8 m/s²", isCorrect: false },
    { key: "D", text: "5,4 m/s²", isCorrect: false },
  ];

  const handleSelect = (key: string) => {
    setSelectedOption(key);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowExplanation(true);
  };

  return (
    <section id="hero" className="relative overflow-hidden pt-8 pb-16 sm:py-20 lg:py-24">
      {/* Subtle Ambient Glow behind Hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-[#16A34A]/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Value Proposition & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left">
            {/* Merdeka & SNBT Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-xs font-bold tracking-tight">
                Kurikulum Merdeka SMA 2026 &bull; Persiapan SNBT/UTBK
              </span>
            </div>

            {/* Main Headline (Space Grotesk, max 2 lines) */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F172A] leading-[1.12]">
              Belajar Lebih Cerdas.{" "}
              <span className="text-[#15803D] inline-block">Kuasai Lebih Banyak.</span>
            </h1>

            {/* Subheadline Statement */}
            <p className="text-base sm:text-lg text-[#475569] max-w-2xl leading-relaxed">
              Platform latihan mandiri siswa SMA dengan kurikulum nasional terpadu, notasi rumus KaTeX presisi, dan penilaian terkalibrasi IRT tanpa terjebak rumus instan kosong.
            </p>

            {/* Dual Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto pt-2">
              <Link
                href="/register"
                className="px-7 py-3.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-base font-semibold shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                <span>Coba Gratis Sekarang</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </Link>
              <a
                href="#cara-kerja"
                className="px-6 py-3.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#FAF9F5] text-[#0F172A] text-base font-semibold flex items-center justify-center gap-2 transition-all duration-150"
              >
                <PlayCircle className="w-5 h-5 text-[#15803D]" />
                <span>Pelajari Cara Kerja</span>
              </a>
            </div>

            {/* Social Proof Avatar Strip */}
            <div className="pt-6 border-t border-[#E2E0D8] w-full flex flex-wrap items-center gap-4 text-[#475569]">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-[#DCFCE7] flex items-center justify-center text-xs font-bold text-[#15803D]">
                  SM
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-[#FED7AA] flex items-center justify-center text-xs font-bold text-[#C2410C]">
                  AR
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-[#E0E7FF] flex items-center justify-center text-xs font-bold text-[#4338CA]">
                  NK
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-[#FCE7F3] flex items-center justify-center text-xs font-bold text-[#BE185D]">
                  FZ
                </div>
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-[#0F172A]">Dipercaya 15.000+</span> pelajar SMA &amp;{" "}
                <span className="font-bold text-[#0F172A]">350+</span> sekolah di seluruh Indonesia
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Practice Question Card */}
          <div className="lg:col-span-5 relative" data-ui="true">
            {/* Context Floating Chip */}
            <div className="absolute -top-3.5 right-4 z-20 bg-[#EA580C] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulasi Fisika SMA — Dinamika Gerak</span>
            </div>

            {/* Practice Interactive Card */}
            <div className="bg-white border border-[#E2E0D8] rounded-2xl p-5 sm:p-6 shadow-sm relative space-y-4">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-[#E2E0D8] pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E2E0D8] text-xs font-bold text-[#0F172A]">
                    Soal #08
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FFF7ED] border border-[#FED7AA] text-xs font-bold text-[#EA580C]">
                    Taraf HOTS
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#15803D] bg-[#F0FDF4] px-2.5 py-1 rounded-md border border-[#BBF7D0]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>IRT: +14 Poin</span>
                </div>
              </div>

              {/* Problem Stem */}
              <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed">
                Sebuah balok bermassa <span className="font-semibold italic">m = 4 kg</span> meluncur pada bidang miring kasar dengan sudut kemiringan <span className="font-semibold italic">&theta; = 37&deg;</span>. Gaya gesek kinetik dirumuskan:
              </p>

              {/* KaTeX Block */}
              <div className="bg-[#FAF9F5] border-l-3 border-[#15803D] px-4 py-2.5 rounded-r-xl overflow-x-auto text-center text-[#0F172A]">
                <MathRenderer text="\\[ F_k = \mu_k \cdot N = \mu_k \cdot m \cdot g \cdot \cos(\theta) \\]" />
              </div>

              <p className="text-xs text-[#475569]">
                Jika koefisien gesek <span className="font-semibold italic">&mu;<sub>k</sub> = 0,25</span> dan percepatan gravitasi <span className="font-semibold italic">g = 10 m/s&sup2;</span>, berapakah besar percepatan gerak luncur balok?
              </p>

              {/* Multiple Choice Options (Interactive) */}
              <div className="space-y-2 pt-1" role="radiogroup" aria-label="Pilihan Jawaban">
                {options.map((opt) => {
                  const isSelected = selectedOption === opt.key;
                  const isCorrectAnswer = opt.isCorrect;

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => handleSelect(opt.key)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all text-left cursor-pointer",
                        isSelected
                          ? "border-[#15803D] bg-[#F0FDF4] text-[#15803D] shadow-xs"
                          : "border-[#E2E0D8] bg-white hover:border-[#CBD5E1] text-[#0F172A]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors",
                            isSelected
                              ? "bg-[#15803D] text-white"
                              : "bg-[#FAF9F5] text-[#475569] border border-[#E2E0D8]"
                          )}
                        >
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Socratic Concept Explanation Drawer */}
              {showExplanation && (
                <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#BBF7D0] space-y-1.5 animate-fade-in text-xs text-[#0F172A]">
                  <div className="flex items-center gap-1.5 font-bold text-[#15803D]">
                    <Check className="w-4 h-4" />
                    <span>Pembahasan Konseptual Terstruktur:</span>
                  </div>
                  <p className="text-[#475569] leading-relaxed">
                    Komponen gaya sepanjang bidang miring: <span className="font-semibold">w<sub>x</sub> = m&middot;g&middot;sin(37&deg;) = 4(10)(0,6) = 24 N</span>.
                    Gaya normal: <span className="font-semibold">N = m&middot;g&middot;cos(37&deg;) = 4(10)(0,8) = 32 N</span>.
                    Gaya gesek kinetik: <span className="font-semibold">F<sub>k</sub> = 0,25 &times; 32 = 8 N</span>.
                    Resultan gaya: <span className="font-semibold">&Sigma;F = 24 - 8 = 16 N</span>.
                    Maka percepatan: <span className="font-semibold">a = &Sigma;F / m = 16 / 4 = 4,0 m/s&sup2;</span> (Opsi B).
                  </p>
                </div>
              )}

              {/* Card Action Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-[#E2E0D8]">
                <button
                  type="button"
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="text-xs font-semibold text-[#EA580C] hover:text-[#C2410C] flex items-center gap-1.5 transition-colors"
                >
                  <Lightbulb className="w-4 h-4 text-[#EA580C]" />
                  <span>{showExplanation ? "Sembunyikan Solusi" : "Cek Solusi Konsep"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {submitted ? "Jawaban Terverifikasi" : "Periksa Jawaban"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
