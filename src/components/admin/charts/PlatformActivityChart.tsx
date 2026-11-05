"use client";

import React, { useState } from "react";
import { CheckCircle2, PlayCircle, Users, Activity, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformActivityPoint } from "@/types/admin";

interface PlatformActivityChartProps {
  data: PlatformActivityPoint[];
  totalStartedInPeriod: number;
  totalCompletedInPeriod: number;
  completionRateInPeriod: number;
  selectedDays: number;
  onChangeDays?: (days: number) => void;
  loading?: boolean;
  error?: string | null;
}

export const PlatformActivityChart: React.FC<PlatformActivityChartProps> = ({
  data,
  totalStartedInPeriod,
  totalCompletedInPeriod,
  completionRateInPeriod,
  selectedDays,
  onChangeDays,
  loading = false,
  error = null,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-red-200 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h4 className="text-sm font-bold text-[#0F172A]">Gagal Memuat Grafik Aktivitas</h4>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  const isEmpty = !data || data.length === 0 || totalStartedInPeriod === 0;

  if (isEmpty && !loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] text-center space-y-2">
        <Activity className="w-8 h-8 text-[#94A3B8] mx-auto" />
        <h4 className="text-sm font-bold text-[#0F172A]">Belum Ada Aktivitas Sesi</h4>
        <p className="text-xs text-[#64748B]">
          Belum ada sesi kuis yang dimulai atau diselesaikan siswa pada rentang waktu ini.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.startedSessions, d.completedSessions, d.activeUsers)),
    4
  );

  const width = 640;
  const height = 220;
  const padX = 40;
  const padTop = 20;
  const padBottom = 36;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padTop - padBottom;

  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(1, data.length - 1)) * innerWidth;
    const yStarted = padTop + innerHeight - (d.startedSessions / maxVal) * innerHeight;
    const yCompleted = padTop + innerHeight - (d.completedSessions / maxVal) * innerHeight;
    return {
      x,
      yStarted,
      yCompleted,
      started: d.startedSessions,
      completed: d.completedSessions,
      activeUsers: d.activeUsers,
      label: d.label,
      date: d.date,
    };
  });

  const linePathStarted = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.yStarted}` : `${acc} L ${pt.x} ${pt.yStarted}`;
  }, "");

  const linePathCompleted = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.yCompleted}` : `${acc} L ${pt.x} ${pt.yCompleted}`;
  }, "");

  const baselineY = padTop + innerHeight;

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Aktivitas Platform & Sesi Kuis
            </h3>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
              {completionRateInPeriod}% Selesai
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            {totalStartedInPeriod} sesi dimulai &bull; {totalCompletedInPeriod} sesi diselesaikan siswa ({selectedDays} hari)
          </p>
        </div>

        {/* Legend & Days filter */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-3 text-xs font-semibold text-[#475569]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              Sesi Dimulai
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
              Selesai
            </span>
          </div>

          {onChangeDays && (
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => onChangeDays(days)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                    selectedDays === days
                      ? "bg-[#0F172A] text-white shadow-xs"
                      : "text-[#64748B] hover:text-[#0F172A]"
                  )}
                >
                  {days}H
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SVG Multi-line Chart */}
      <div className="relative w-full overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
            <span className="text-xs font-semibold text-[#0F172A]">Memperbarui data aktivitas...</span>
          </div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padTop + innerHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
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
                  fontSize="10"
                  fill="#475569"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Line 1: Started Sessions (Blue) */}
          {linePathStarted && (
            <path
              d={linePathStarted}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Line 2: Completed Sessions (Green) */}
          {linePathCompleted && (
            <path
              d={linePathCompleted}
              fill="none"
              stroke="#16A34A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g key={idx}>
                {/* Started circle */}
                <circle
                  cx={pt.x}
                  cy={pt.yStarted}
                  r={isHovered ? 5 : 3.5}
                  fill={isHovered ? "#2563EB" : "#FFFFFF"}
                  stroke="#2563EB"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Completed circle */}
                <circle
                  cx={pt.x}
                  cy={pt.yCompleted}
                  r={isHovered ? 5 : 3.5}
                  fill={isHovered ? "#16A34A" : "#FFFFFF"}
                  stroke="#16A34A"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Hover trigger bar */}
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

                {(data.length <= 10 || idx % 2 === 0 || idx === data.length - 1) && (
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

        {/* Hover Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (() => {
          const rawLeft = (points[hoveredIdx].x / width) * 100;
          const clampedLeft = Math.max(16, Math.min(84, rawLeft));
          const pt = points[hoveredIdx];
          const rate = pt.started > 0 ? Math.round((pt.completed / pt.started) * 100) : 0;
          return (
            <div
              className="absolute z-20 pointer-events-none bg-[#0F172A] text-white px-3.5 py-2.5 rounded-xl text-xs shadow-lg border border-slate-700 space-y-1.5 transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${clampedLeft}%`,
                top: `${(Math.min(pt.yStarted, pt.yCompleted) / height) * 100}%`,
                marginTop: "-12px",
              }}
            >
              <p className="text-[10px] text-slate-400 font-semibold border-b border-slate-700 pb-1">
                {pt.date}
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#93C5FD] flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" /> Dimulai:
                  </span>
                  <span className="font-mono font-bold text-white">{pt.started}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#86EFAC] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Selesai:
                  </span>
                  <span className="font-mono font-bold text-white">{pt.completed}</span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[10px] text-slate-300">
                  <span>Pengguna Aktif:</span>
                  <span className="font-bold text-white">{pt.activeUsers} siswa</span>
                </div>
                <div className="text-[10px] text-amber-300 font-semibold">
                  Tingkat Penyelesaian: {rate}%
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default PlatformActivityChart;
