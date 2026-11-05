"use client";

import React, { useState } from "react";
import { Cpu, CheckCircle2, XCircle, Clock, Zap, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIProviderAnalytics } from "@/types/admin";

interface AIUsageAnalyticsChartProps {
  data: AIProviderAnalytics;
  selectedDays: number;
  onChangeDays?: (days: number) => void;
  loading?: boolean;
  error?: string | null;
}

export const AIUsageAnalyticsChart: React.FC<AIUsageAnalyticsChartProps> = ({
  data,
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
        <h4 className="text-sm font-bold text-[#0F172A]">Gagal Memuat Metrik AI</h4>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  const isEmpty = !data || data.totalRequests === 0;

  if (isEmpty && !loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] text-center space-y-2">
        <Cpu className="w-8 h-8 text-[#94A3B8] mx-auto" />
        <h4 className="text-sm font-bold text-[#0F172A]">Belum Ada Permintaan AI</h4>
        <p className="text-xs text-[#64748B]">
          Belum ada aktivitas request generator soal AI pada rentang waktu ini.
        </p>
      </div>
    );
  }

  const dailyTrend = data.dailyTrend || [];
  const maxReq = Math.max(...dailyTrend.map((d) => d.totalRequests), 4);
  const maxLat = Math.max(...dailyTrend.map((d) => d.avgLatencyMs), 1000);

  // SVG Geometry
  const width = 640;
  const height = 210;
  const padX = 40;
  const padTop = 20;
  const padBottom = 36;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padTop - padBottom;

  const points = dailyTrend.map((d, i) => {
    const x = padX + (i / Math.max(1, dailyTrend.length - 1)) * innerWidth;
    const yReq = padTop + innerHeight - (d.totalRequests / maxReq) * innerHeight;
    const yLat = padTop + innerHeight - (d.avgLatencyMs / maxLat) * innerHeight;
    return {
      x,
      yReq,
      yLat,
      total: d.totalRequests,
      success: d.successfulRequests,
      failed: d.failedRequests,
      latency: d.avgLatencyMs,
      label: d.label,
      date: d.date,
    };
  });

  const linePathReq = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.yReq}` : `${acc} L ${pt.x} ${pt.yReq}`;
  }, "");

  const baselineY = padTop + innerHeight;

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Utilisasi & Latensi AI Generation Engine
            </h3>
            <span
              className={cn(
                "text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border",
                data.successRate >= 90
                  ? "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]"
                  : "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]"
              )}
            >
              {data.successRate}% Sukses
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            {data.totalRequests} total request &bull; {data.successfulRequests} berhasil &bull; {data.failedRequests} gagal &bull; Rerata {data.avgLatencyMs} ms
          </p>
        </div>

        {/* Legend & Days filter */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-3 text-xs font-semibold text-[#475569]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
              Volume Request
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
              Latensi (ms)
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

      {/* SVG Latency & Request Trend Chart */}
      <div className="relative w-full overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
            <span className="text-xs font-semibold text-[#0F172A]">Memperbarui metrik AI...</span>
          </div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          {/* Horizontal Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padTop + innerHeight * (1 - pct);
            const reqVal = Math.round(maxReq * pct);
            const latVal = Math.round(maxLat * pct);
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
                {/* Left Y Axis: Request count */}
                <text
                  x={padX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#7C3AED"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {reqVal}
                </text>
                {/* Right Y Axis: Latency ms */}
                <text
                  x={width - padX + 8}
                  y={y + 3}
                  textAnchor="start"
                  fontSize="9"
                  fill="#EA580C"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {latVal}ms
                </text>
              </g>
            );
          })}

          {/* Volume Line (Purple) */}
          {linePathReq && (
            <path
              d={linePathReq}
              fill="none"
              stroke="#7C3AED"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.yReq}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? "#7C3AED" : "#FFFFFF"}
                  stroke="#7C3AED"
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

        {/* Hover Tooltip */}
        {hoveredIdx !== null && points[hoveredIdx] && (() => {
          const rawLeft = (points[hoveredIdx].x / width) * 100;
          const clampedLeft = Math.max(16, Math.min(84, rawLeft));
          const pt = points[hoveredIdx];
          return (
            <div
              className="absolute z-20 pointer-events-none bg-[#0F172A] text-white px-3.5 py-2.5 rounded-xl text-xs shadow-lg border border-slate-700 space-y-1.5 transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${clampedLeft}%`,
                top: `${(pt.yReq / height) * 100}%`,
                marginTop: "-12px",
              }}
            >
              <p className="text-[10px] text-slate-400 font-semibold border-b border-slate-700 pb-1">
                {pt.date}
              </p>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-purple-300">Total Request:</span>
                  <span className="font-mono font-bold text-white">{pt.total}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[11px]">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Sukses:
                  </span>
                  <span className="font-mono font-bold">{pt.success}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[11px]">
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Gagal:
                  </span>
                  <span className="font-mono font-bold">{pt.failed}</span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-amber-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Latensi:
                  </span>
                  <span className="font-mono font-bold text-white">{pt.latency} ms</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Provider & Model Distribution Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#F1F5F9]">
        {/* By Provider */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
          <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
            Distribusi Provider AI Terpasang
          </span>
          <div className="space-y-2">
            {data.byProvider && data.byProvider.length > 0 ? (
              data.byProvider.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#334155] capitalize">{p.provider}</span>
                    <span className="font-mono text-[#64748B]">
                      {p.count} req ({p.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div
                      className="h-full bg-[#7C3AED] rounded-full transition-all duration-500"
                      style={{ width: `${p.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#94A3B8]">Belum ada data distribusi provider.</p>
            )}
          </div>
        </div>

        {/* By Model */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
          <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
            Distribusi Model Generatif
          </span>
          <div className="space-y-2">
            {data.byModel && data.byModel.length > 0 ? (
              data.byModel.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold font-mono text-[#334155] truncate max-w-[150px]">
                      {m.model}
                    </span>
                    <span className="font-mono text-[#64748B]">
                      {m.count} req ({m.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                      style={{ width: `${m.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#94A3B8]">Belum ada data distribusi model.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIUsageAnalyticsChart;
