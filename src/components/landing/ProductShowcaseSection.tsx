"use client";

import React, { useState } from "react";
import {
  Timer,
  CheckCircle2,
  Check,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Flag,
  Sparkles,
} from "lucide-react";
import { MathRenderer } from "@/components/MathRenderer";
import { cn } from "@/lib/utils";

export const ProductShowcaseSection: React.FC = () => {
  const [activeNumber, setActiveNumber] = useState<number>(14);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("B");
  const [isFlagged, setIsFlagged] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Question navigation grid (1 to 20)
  const questionStatus = [
    { num: 1, status: "done" },
    { num: 2, status: "done" },
    { num: 3, status: "done" },
    { num: 4, status: "done" },
    { num: 5, status: "done" },
    { num: 6, status: "done" },
    { num: 7, status: "done" },
    { num: 8, status: "flagged" },
    { num: 9, status: "done" },
    { num: 10, status: "done" },
    { num: 11, status: "done" },
    { num: 12, status: "done" },
    { num: 13, status: "done" },
    { num: 14, status: "current" },
    { num: 15, status: "empty" },
    { num: 16, status: "empty" },
    { num: 17, status: "empty" },
    { num: 18, status: "empty" },
    { num: 19, status: "empty" },
    { num: 20, status: "empty" },
  ];

  const choices = [
    { key: "A", val: "1" },
    { key: "B", val: "2", isCorrect: true },
    { key: "C", val: "4" },
    { key: "D", val: "0" },
  ];

  return (
    <section id="showcase" className="py-20 sm:py-24 bg-[#FAF9F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#15803D]">
              Antarmuka Latihan Aktif
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mt-2 leading-tight">
              Ruang Latihan Mandiri: Fokus &amp; Bebas Distraksi
            </h2>
            <p className="text-base text-[#475569] mt-1">
              Simulasi lingkungan belajar nyata tanpa banner iklan atau tombol membingungkan.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#15803D] bg-[#F0FDF4] px-3.5 py-1.5 rounded-full border border-[#BBF7D0] self-start md:self-end">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span>Mode Ujian Terkalibrasi</span>
          </div>
        </div>

        {/* Real Workspace Simulator Frame (marked with data-ui for taste-skill) */}
        <div
          data-ui="true"
          className="bg-white rounded-2xl border-2 border-[#CBD5E1] shadow-card overflow-hidden"
        >
          {/* Header Bar */}
          <div className="bg-[#FAF9F5] px-5 sm:px-7 py-3.5 border-b border-[#E2E0D8] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <span className="w-3 h-3 rounded-full bg-[#10B981]" />
              </div>
              <div className="h-4 w-px bg-[#CBD5E1] mx-1" />
              <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                Simulasi UTBK Matematika &mdash; Kalkulus &amp; Turunan Fungsi
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer Countdown */}
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-[#E2E0D8] text-xs font-mono font-bold text-[#C2410C]">
                <Timer className="w-4 h-4 text-[#EA580C]" />
                <span>24:18</span>
              </div>
              {/* Flag Toggle Button */}
              <button
                type="button"
                onClick={() => setIsFlagged(!isFlagged)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border",
                  isFlagged
                    ? "bg-[#FFF7ED] border-[#FED7AA] text-[#C2410C]"
                    : "bg-white border-[#E2E0D8] text-[#475569] hover:bg-[#FAF9F5]"
                )}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{isFlagged ? "Tertandai Ragu" : "Tandai Ragu-Ragu"}</span>
              </button>
            </div>
          </div>

          {/* Workspace Body: Split 8 cols left + 4 cols right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E0D8]">
            {/* Left Area (8 cols): Question & Choices */}
            <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Soal Nomor {activeNumber} dari 20
                  </span>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-[#FAF9F5] border border-[#E2E0D8] text-[#0F172A]">
                    Kalkulus Diferensial SMA
                  </span>
                </div>

                <p className="text-sm sm:text-base text-[#0F172A] leading-relaxed">
                  Tentukan nilai limit fungsi trigonometri berikut untuk mendeteksi gradien garis singgung kurva pada titik asal:
                </p>

                {/* Display Math Formula Block */}
                <div className="bg-[#FAF9F5] p-4 rounded-xl border border-[#E2E0D8] text-center my-4 overflow-x-auto text-[#0F172A]">
                  <MathRenderer text="\\[ L = \lim_{x \to 0} \frac{\sin(4x)}{2x \cdot \cos(x)} \\]" />
                </div>

                <p className="text-xs text-[#64748B]">
                  Petunjuk konseptual: Perhatikan sifat dasar limit trigonometri <MathRenderer text="$\lim_{u \to 0} \frac{\sin(u)}{u} = 1$" className="inline" /> dan nilai kontinuitas <MathRenderer text="$\cos(0) = 1$" className="inline" />.
                </p>

                {/* Choice Cards (Interactive) */}
                <div className="space-y-2.5 pt-2">
                  {choices.map((c) => {
                    const isSelected = selectedAnswer === c.key;

                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setSelectedAnswer(c.key)}
                        className={cn(
                          "w-full flex items-center justify-between p-3.5 rounded-xl border text-sm font-medium transition-all text-left",
                          isSelected
                            ? "border-[#15803D] bg-[#F0FDF4] text-[#15803D] shadow-2xs font-semibold"
                            : "border-[#E2E0D8] bg-white hover:border-[#CBD5E1] text-[#0F172A]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs",
                              isSelected
                                ? "bg-[#15803D] text-white"
                                : "bg-[#FAF9F5] text-[#475569] border border-[#E2E0D8]"
                            )}
                          >
                            {c.key}
                          </span>
                          <span>{c.val}</span>
                        </div>
                        {isSelected && (
                          <span className="text-xs font-bold text-[#15803D] flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Pilihan Anda
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Socratic Hint Drawer */}
                {showHint && (
                  <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1 animate-fade-in">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#D97706]" />
                      Petunjuk Sokratik:
                    </p>
                    <p className="leading-relaxed">
                      Pisahkan pecahan menjadi <MathRenderer text="$\frac{4}{2} \cdot \frac{\sin(4x)}{4x} \cdot \frac{1}{\cos(x)}$" className="inline" />. Evaluasi masing-masing bagian saat <MathRenderer text="$x \to 0$" className="inline" />.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E0D8]">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="px-3.5 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] hover:bg-[#FAF9F5] flex items-center gap-1.5 transition-colors"
                >
                  <Lightbulb className="w-4 h-4 text-[#EA580C]" />
                  <span>{showHint ? "Sembunyikan Petunjuk" : "Petunjuk Sokratik"}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveNumber(Math.max(1, activeNumber - 1))}
                    className="px-4 py-2 rounded-xl bg-[#FAF9F5] hover:bg-[#F3F4EE] border border-[#E2E0D8] text-xs font-semibold text-[#0F172A] flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNumber(Math.min(20, activeNumber + 1))}
                    className="px-5 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold shadow-xs flex items-center gap-1"
                  >
                    <span>Simpan &amp; Lanjut</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Area (4 cols): Navigation Palette & Status */}
            <div className="lg:col-span-4 p-6 bg-[#FAF9F5] flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-[#0F172A]">Navigasi Butir Soal</h4>
                  <span className="text-xs font-semibold text-[#15803D] bg-[#F0FDF4] px-2 py-0.5 rounded border border-[#BBF7D0]">
                    13 Terjawab
                  </span>
                </div>

                {/* 1-20 Question Number Palette */}
                <div className="grid grid-cols-5 gap-2" role="group" aria-label="Kisi Nomor Soal">
                  {questionStatus.map((q) => {
                    const isCur = q.num === activeNumber;
                    const isDone = q.status === "done";
                    const isFlag = q.status === "flagged";

                    return (
                      <button
                        key={q.num}
                        type="button"
                        onClick={() => setActiveNumber(q.num)}
                        className={cn(
                          "h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all cursor-pointer",
                          isCur
                            ? "bg-[#0F172A] text-white ring-2 ring-[#15803D] ring-offset-1"
                            : isFlag
                            ? "bg-[#EA580C] text-white"
                            : isDone
                            ? "bg-[#15803D] text-white"
                            : "bg-white text-[#64748B] border border-[#E2E0D8] hover:border-[#CBD5E1]"
                        )}
                        aria-label={`Buka soal nomor ${q.num}`}
                      >
                        {q.num}
                      </button>
                    );
                  })}
                </div>

                {/* Legend indicator */}
                <div className="grid grid-cols-2 gap-2 mt-5 text-[11px] text-[#64748B] pt-4 border-t border-[#E2E0D8]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-[#15803D]" />
                    <span>Terjawab (13)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-[#EA580C]" />
                    <span>Ragu-ragu (1)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-[#0F172A]" />
                    <span>Sedang Dikerjakan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-white border border-[#E2E0D8]" />
                    <span>Belum Dijawab (6)</span>
                  </div>
                </div>
              </div>

              {/* Progress Summary Card */}
              <div className="p-4 rounded-xl bg-white border border-[#E2E0D8] space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#0F172A]">Progres Sesi Latihan</span>
                  <span className="text-[#15803D]">70% Tuntas</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E2E0D8] overflow-hidden">
                  <div className="h-full bg-[#15803D] rounded-full w-[70%]" />
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Selesaikan 6 soal lagi untuk menerbitkan laporan skor IRT lengkap.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
