"use client";

import React, { useState } from "react";
import { UserPlus, Users, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserGrowthPoint } from "@/types/admin";

interface UserGrowthChartProps {
  data: UserGrowthPoint[];
  totalNewInPeriod: number;
  totalUsersOverall: number;
  selectedDays: number;
  onChangeDays?: (days: number) => void;
  loading?: boolean;
  error?: string | null;
}

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({
  data,
  totalNewInPeriod,
  totalUsersOverall,
  selectedDays,
  onChangeDays,
  loading = false,
  error = null,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"new" | "cumulative">("new");

  if (error) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-red-200 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <h4 className="text-sm font-bold text-[#0F172A]">Gagal Memuat Grafik Pengguna</h4>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  const isEmpty = !data || data.length === 0 || (totalNewInPeriod === 0 && totalUsersOverall === 0);

  if (isEmpty && !loading) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#E2E8F0] text-center space-y-2">
        <Users className="w-8 h-8 text-[#94A3B8] mx-auto" />
        <h4 className="text-sm font-bold text-[#0F172A]">Belum Ada Data Registrasi</h4>
        <p className="text-xs text-[#64748B]">
          Belum ada pengguna yang tercatat mendaftar pada rentang waktu ini.
        </p>
      </div>
    );
  }

  const values = data.map((d) => (viewMode === "new" ? d.newUsers : d.cumulativeUsers));
  const maxVal = Math.max(...values, 4);

  // SVG Geometry
  const width = 640;
  const height = 210;
  const padX = 40;
  const padTop = 20;
  const padBottom = 36;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padTop - padBottom;

  const points = data.map((d, i) => {
    const val = viewMode === "new" ? d.newUsers : d.cumulativeUsers;
    const x = padX + (i / Math.max(1, data.length - 1)) * innerWidth;
    const y = padTop + innerHeight - (val / maxVal) * innerHeight;
    return { x, y, val, label: d.label, date: d.date, raw: d };
  });

  const linePath = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, "");

  const baselineY = padTop + innerHeight;
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
      : "";

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
              Pertumbuhan & Registrasi Pengguna
            </h3>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
              +{totalNewInPeriod} Baru ({selectedDays} Hari)
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Total {totalUsersOverall} pengguna terdaftar di platform berdasarkan tanggal registrasi riil
          </p>
        </div>

        {/* View mode toggle & Days selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode("new")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                viewMode === "new" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B]"
              )}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cumulative")}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all cursor-pointer",
                viewMode === "cumulative" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B]"
              )}
            >
              Kumulatif
            </button>
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

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
            <span className="text-xs font-semibold text-[#0F172A]">Memperbarui data pertumbuhan...</span>
          </div>
        )}

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
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

          {/* Area & Line */}
          {areaPath && <path d={areaPath} fill="url(#userGrowthGrad)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#16A34A"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points & Hover Targets */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  fill={isHovered ? "#16A34A" : "#FFFFFF"}
                  stroke="#16A34A"
                  strokeWidth="2.5"
                  className="transition-all duration-150 cursor-pointer"
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
          const clampedLeft = Math.max(14, Math.min(86, rawLeft));
          const pt = points[hoveredIdx];
          return (
            <div
              className="absolute z-20 pointer-events-none bg-[#0F172A] text-white px-3 py-2 rounded-xl text-xs shadow-lg border border-slate-700 space-y-1 transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${clampedLeft}%`,
                top: `${(pt.y / height) * 100}%`,
                marginTop: "-12px",
              }}
            >
              <p className="text-[10px] text-slate-400 font-semibold">{pt.date}</p>
              <p className="font-bold text-sm text-white">
                {pt.val} {viewMode === "new" ? "Pengguna Baru" : "Total Akun"}
              </p>
              {viewMode === "new" && (
                <p className="text-[10px] text-emerald-400">
                  Kumulatif: {pt.raw.cumulativeUsers} pengguna
                </p>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
