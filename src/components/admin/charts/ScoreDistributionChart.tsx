"use client";

import React, { useState } from "react";
import { CheckCircle2, TrendingUp, Award, AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreDistributionAnalytics } from "@/types/admin";

interface ScoreDistributionChartProps {
  data: ScoreDistributionAnalytics;
  selectedDays?: number;
  loading?: boolean;
  error?: string | null;
}

export const ScoreDistributionChart: React.FC<ScoreDistributionChartProps> = ({
  data,
  selectedDays = 7,
  loading = false,
  error = null,
}) => {
  const [activeMethod, setActiveMethod] = useState<"irt" | "fallback">("irt");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-red-200 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h4 className="text-sm font-bold text-[#0F172A]">Gagal Memuat Distribusi Skor</h4>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  const isEmpty = !data || (data.irt3pl.totalSessions === 0 && data.fallbackPercentage.totalSessions === 0);

  if (isEmpty && !loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] text-center space-y-2">
        <Award className="w-8 h-8 text-[#94A3B8] mx-auto" />
        <h4 className="text-sm font-bold text-[#0F172A]">Belum Ada Sesi Selesai</h4>
        <p className="text-xs text-[#64748B]">
          Belum ada sesi kuis yang diselesaikan untuk menghasilkan distribusi nilai siswa.
        </p>
      </div>
    );
  }

  const { irt3pl, fallbackPercentage, completionStats } = data;
  const isIrt = activeMethod === "irt";
  const currentMethodData = isIrt ? irt3pl : fallbackPercentage;
  const dailyTrend = currentMethodData.dailyTrend || [];

  // Trend SVG Geometry
  const width = 640;
  const height = 180;
  const padX = 40;
  const padTop = 15;
  const padBottom = 32;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padTop - padBottom;

  // Scale ranges
  const minScale = isIrt ? 200 : 0;
  const maxScale = isIrt ? 1000 : 100;

  const points = dailyTrend.map((d, i) => {
    const x = padX + (i / Math.max(1, dailyTrend.length - 1)) * innerWidth;
    const val = d.avgScore !== null ? d.avgScore : minScale;
    const clampedVal = Math.max(minScale, Math.min(maxScale, val));
    const y = padTop + innerHeight - ((clampedVal - minScale) / (maxScale - minScale)) * innerHeight;
    return {
      x,
      y,
      score: d.avgScore,
      sessionsCount: d.sessionsCount,
      label: d.label,
      date: d.date,
    };
  });

  const validPoints = points.filter((p) => p.score !== null);
  const linePath = validPoints.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const baselineY = padTop + innerHeight;

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header & Scale Separator Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Distribusi Hasil & Evaluasi Kuis Siswa
            </h3>
            <span
              className={cn(
                "text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border",
                isIrt
                  ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
                  : "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]"
              )}
            >
              {isIrt ? "Skala IRT 200 – 1.000" : "Skala Standar 0 – 100%"}
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Pemisahan transparan model psikometri IRT 3-PL terkalibrasi dan metode persentase fallback
          </p>
        </div>

        {/* Explicit Method Toggle */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMethod("irt")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              isIrt ? "bg-[#16A34A] text-white shadow-xs font-bold" : "text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            <Award className="w-3.5 h-3.5" />
            <span>IRT 3-PL ({irt3pl.totalSessions})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMethod("fallback")}
            className={cn(
              "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
              !isIrt ? "bg-[#2563EB] text-white shadow-xs font-bold" : "text-[#64748B] hover:text-[#0F172A]"
            )}
          >
            <span>Persentase ({fallbackPercentage.totalSessions})</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Ribbon for Active Method */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E2E8F0]">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Rerata Nilai</span>
          <span className="text-xl font-extrabold font-mono text-[#0F172A]">
            {currentMethodData.avgScoreFormatted}
          </span>
          <span className="text-[10px] text-[#64748B] block mt-0.5">
            {isIrt ? "Skala 200–1.000" : "Skala 0–100%"}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E2E8F0]">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Total Sesi Diuji</span>
          <span className="text-xl font-extrabold font-mono text-[#0F172A]">
            {currentMethodData.totalSessions}
          </span>
          <span className="text-[10px] text-[#16A34A] font-semibold block mt-0.5">Selesai terverifikasi</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E2E8F0]">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Skor Tertinggi</span>
          <span className="text-xl font-extrabold font-mono text-[#16A34A]">
            {currentMethodData.maxScore !== null ? currentMethodData.maxScore.toFixed(2) : "-"}
          </span>
          <span className="text-[10px] text-[#64748B] block mt-0.5">Capaian maksimal</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FAF9F5] border border-[#E2E8F0]">
          <span className="text-[10px] uppercase font-bold text-[#64748B] block">Skor Terendah</span>
          <span className="text-xl font-extrabold font-mono text-[#EA580C]">
            {currentMethodData.minScore !== null ? currentMethodData.minScore.toFixed(2) : "-"}
          </span>
          <span className="text-[10px] text-[#64748B] block mt-0.5">Batas bawah empiris</span>
        </div>
      </div>

      {/* Distribution Ranges (Bar Chart) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
          Rentang Distribusi Nilai Siswa ({isIrt ? "IRT 3-PL" : "Persentase Fallback"})
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {currentMethodData.ranges.map((r, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-[#E2E8F0] bg-white space-y-2 hover:border-[#16A34A] transition-all"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-[#0F172A]">{r.range}</span>
                <span className="text-lg font-mono font-extrabold text-[#0F172A]">{r.count}</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-tight">{r.label}</p>
              <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isIrt ? "bg-[#16A34A]" : "bg-[#2563EB]"
                  )}
                  style={{ width: `${r.percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-right font-mono text-[#64748B]">{r.percentage}% sesi</p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Score Trend SVG */}
      <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#16A34A]" />
            Tren Nilai Rata-Rata Harian ({selectedDays} Hari)
          </span>
          <span className="text-[11px] text-[#64748B]">
            {isIrt ? "Skala IRT 200 – 1.000" : "Skala 0 – 100%"}
          </span>
        </div>

        <div className="relative w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
            {/* Grid Lines */}
            {[0, 0.33, 0.66, 1].map((pct, i) => {
              const y = padTop + innerHeight * (1 - pct);
              const val = Math.round(minScale + (maxScale - minScale) * pct);
              return (
                <g key={i}>
                  <line
                    x1={padX}
                    y1={y}
                    x2={width - padX}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#64748B"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke={isIrt ? "#16A34A" : "#2563EB"}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Points */}
            {points.map((pt, idx) => {
              if (pt.score === null) return null;
              const isHovered = hoveredIdx === idx;
              return (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : 3.5}
                    fill={isHovered ? (isIrt ? "#16A34A" : "#2563EB") : "#FFFFFF"}
                    stroke={isIrt ? "#16A34A" : "#2563EB"}
                    strokeWidth="2"
                    className="transition-all"
                  />

                  <rect
                    x={pt.x - 14}
                    y={padTop}
                    width="28"
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />

                  {(dailyTrend.length <= 10 || idx % 2 === 0 || idx === dailyTrend.length - 1) && (
                    <text
                      x={pt.x}
                      y={baselineY + 18}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#334155"
                      fontWeight="600"
                    >
                      {pt.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {hoveredIdx !== null && points[hoveredIdx] && points[hoveredIdx].score !== null && (() => {
            const rawLeft = (points[hoveredIdx].x / width) * 100;
            const clampedLeft = Math.max(16, Math.min(84, rawLeft));
            const pt = points[hoveredIdx];
            return (
              <div
                className="absolute z-20 pointer-events-none bg-[#0F172A] text-white px-3 py-2 rounded-xl text-xs shadow-lg border border-slate-700 space-y-1 transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${clampedLeft}%`,
                  top: `${(pt.y / height) * 100}%`,
                  marginTop: "-10px",
                }}
              >
                <p className="text-[10px] text-slate-400 font-semibold">{pt.date}</p>
                <p className="font-bold text-sm text-white">
                  Rata-rata: {pt.score?.toFixed(2)}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono">
                  {pt.sessionsCount} sesi kuis selesai
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Platform Sesi Completion Status Footer */}
      <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <span className="font-bold text-[#0F172A] block">
            Status Penyelesaian Sesi Kuis Siswa:
          </span>
          <span className="text-[#64748B]">
            {completionStats.completed} Selesai ({completionStats.completionRate}%) &bull; {completionStats.abandoned} Ditinggalkan &bull; {completionStats.inProgress} Sedang Berjalan
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 font-mono font-bold text-xs bg-white px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
          <span className="text-[#16A34A]">{completionStats.completed} Selesai</span>
          <span className="text-[#94A3B8]">/</span>
          <span className="text-[#0F172A]">{completionStats.total} Total Sesi</span>
        </div>
      </div>
    </div>
  );
};
