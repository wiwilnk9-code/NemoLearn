"use client";

import React, { useState } from "react";
import { BookOpen, Layers, Cpu, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendItem {
  date: string;
  label: string;
  sessionsCount: number;
  questionsCount: number;
  aiRequestsCount: number;
}

interface ActivityTrendChartProps {
  data: TrendItem[];
  selectedDays: number;
  onChangeDays: (days: number) => void;
  loading?: boolean;
}

export const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({
  data,
  selectedDays,
  onChangeDays,
  loading = false,
}) => {
  const [activeMetric, setActiveMetric] = useState<"sessions" | "questions" | "ai">("sessions");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] text-center text-xs text-[#64748B]">
        Belum ada data tren aktivitas riil yang tercatat pada rentang waktu ini.
      </div>
    );
  }

  // Determine values based on active metric
  const values = data.map((d) => {
    if (activeMetric === "sessions") return d.sessionsCount;
    if (activeMetric === "questions") return d.questionsCount;
    return d.aiRequestsCount;
  });

  const maxValue = Math.max(...values, 4);
  const totalInPeriod = values.reduce((acc, cur) => acc + cur, 0);

  // SVG dimensions
  const width = 640;
  const height = 210;
  const paddingX = 36;
  const paddingTop = 20;
  const paddingBottom = 36;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, index) => {
    const val =
      activeMetric === "sessions"
        ? d.sessionsCount
        : activeMetric === "questions"
        ? d.questionsCount
        : d.aiRequestsCount;

    const x = paddingX + (index / (data.length - 1 || 1)) * innerWidth;
    const y = paddingTop + innerHeight - (val / maxValue) * innerHeight;
    return { x, y, val, label: d.label, date: d.date, raw: d };
  });

  const linePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const baselineY = paddingTop + innerHeight;
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
      : "";

  const metricConfig = {
    sessions: {
      stroke: "#16A34A",
      fill: "url(#greenGradient)",
      label: "Sesi Latihan Siswa",
      icon: BookOpen,
      badgeText: "Aktivitas Kuis",
    },
    questions: {
      stroke: "#EA580C",
      fill: "url(#coralGradient)",
      label: "Butir Soal Dibuat",
      icon: Layers,
      badgeText: "Bank Soal",
    },
    ai: {
      stroke: "#2563EB",
      fill: "url(#blueGradient)",
      label: "Permintaan AI Engine",
      icon: Cpu,
      badgeText: "AI Provider",
    },
  };

  const currentConfig = metricConfig[activeMetric];

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-7 shadow-xs space-y-5">
      {/* Chart Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Aktivitas & Tren Platform
            </h3>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
              {totalInPeriod} Transaksi ({selectedDays} Hari)
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Agregasi transaksi nyata dari database operasional platform
          </p>
        </div>

        {/* Days selector */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
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
              {days} Hari
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(["sessions", "questions", "ai"] as const).map((m) => {
          const cfg = metricConfig[m];
          const Icon = cfg.icon;
          const isSelected = activeMetric === m;

          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setActiveMetric(m);
                setHoveredIndex(null);
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                isSelected
                  ? "bg-[#0F172A] text-white border-[#0F172A] shadow-xs"
                  : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0F172A]"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-10">
            <span className="text-xs font-semibold text-[#0F172A]">Memperbarui data tren...</span>
          </div>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="coralGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EA580C" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingTop + innerHeight * (1 - pct);
            const val = Math.round(maxValue * pct);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
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

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill={currentConfig.fill} />}

          {/* Line stroke */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={currentConfig.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points and Interaction Circles */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? currentConfig.stroke : "#FFFFFF"}
                  stroke={currentConfig.stroke}
                  strokeWidth="2.5"
                  className="transition-all duration-150 cursor-pointer"
                />

                {/* Invisible hover trigger */}
                <rect
                  x={pt.x - 14}
                  y={paddingTop}
                  width="28"
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onTouchStart={() => setHoveredIndex(idx)}
                />

                {/* X Axis Date Labels */}
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

        {/* Hover Tooltip Box */}
        {hoveredIndex !== null && points[hoveredIndex] && (() => {
          const rawLeft = (points[hoveredIndex].x / width) * 100;
          const clampedLeft = Math.max(14, Math.min(86, rawLeft));
          return (
            <div
              className="absolute z-20 pointer-events-none bg-[#0F172A] text-white px-3 py-2 rounded-xl text-xs shadow-lg border border-slate-700 space-y-1 transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${clampedLeft}%`,
                top: `${(points[hoveredIndex].y / height) * 100}%`,
                marginTop: "-12px",
              }}
            >
              <p className="text-[10px] text-slate-400 font-semibold">
                {points[hoveredIndex].date}
              </p>
              <p className="font-bold text-sm text-white">
                {points[hoveredIndex].val} {currentConfig.badgeText}
              </p>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
