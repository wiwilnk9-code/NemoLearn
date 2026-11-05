"use client";

import React, { useState } from "react";
import { PlatformActivityPoint, UserGrowthPoint } from "@/types/admin";
import { cn } from "@/lib/utils";

interface GrowthTrendAreaChartProps {
  platformActivity?: {
    trend: PlatformActivityPoint[];
    totalStartedInPeriod: number;
    totalCompletedInPeriod: number;
    completionRateInPeriod: number;
  };
  userGrowth?: {
    trend: UserGrowthPoint[];
    totalNewInPeriod: number;
    totalUsersOverall: number;
  };
  selectedDays?: number;
}

export const GrowthTrendAreaChart: React.FC<GrowthTrendAreaChartProps> = ({
  platformActivity,
  userGrowth,
  selectedDays = 30,
}) => {
  const [granularity, setGranularity] = useState<"Harian" | "Mingguan" | "Bulanan">("Harian");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activityTrend = platformActivity?.trend || [];
  const growthTrend = userGrowth?.trend || [];

  // If no data, render graceful fallback
  if (activityTrend.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sapphire-card flex flex-col justify-center items-center min-h-[360px] text-center">
        <p className="text-xs text-[#667085] font-mono">Belum ada data tren aktivitas pada periode ini.</p>
      </div>
    );
  }

  // Calculate scales
  const maxActive = Math.max(...activityTrend.map((t) => t.activeUsers || 0), 10);
  const maxSessions = Math.max(...activityTrend.map((t) => t.completedSessions || 0), 10);
  const maxGrowth = Math.max(...growthTrend.map((t) => t.newUsers || 0), 5);
  const maxScale = Math.max(maxActive, maxSessions, maxGrowth, 15);

  const width = 700;
  const height = 240;
  const padBottom = 35;
  const padTop = 20;
  const chartHeight = height - padBottom - padTop;

  // Build coordinate points
  const points = activityTrend.map((item, idx) => {
    const x = (idx / Math.max(1, activityTrend.length - 1)) * width;
    const yActive = padTop + chartHeight - ((item.activeUsers || 0) / maxScale) * chartHeight;
    const ySessions = padTop + chartHeight - ((item.completedSessions || 0) / maxScale) * chartHeight;
    const growthPoint = growthTrend[idx];
    const yGrowth = padTop + chartHeight - ((growthPoint?.newUsers || 0) / maxScale) * chartHeight;

    return {
      x,
      yActive: isNaN(yActive) ? padTop + chartHeight : yActive,
      ySessions: isNaN(ySessions) ? padTop + chartHeight : ySessions,
      yGrowth: isNaN(yGrowth) ? padTop + chartHeight : yGrowth,
      date: item.date,
      label: item.label,
      activeUsers: item.activeUsers || 0,
      completedSessions: item.completedSessions || 0,
      newUsers: growthPoint?.newUsers || 0,
    };
  });

  // Calculate Averages for the Legend
  const avgActive = Math.round(
    activityTrend.reduce((sum, d) => sum + (d.activeUsers || 0), 0) / Math.max(1, activityTrend.length)
  );
  const avgSessions = Math.round(
    activityTrend.reduce((sum, d) => sum + (d.completedSessions || 0), 0) / Math.max(1, activityTrend.length)
  );
  const avgNewUsers = Math.round(
    growthTrend.reduce((sum, d) => sum + (d.newUsers || 0), 0) / Math.max(1, growthTrend.length)
  );

  // Polyline strings
  const activePolyline = points.map((p) => `${p.x},${p.yActive}`).join(" ");
  const sessionsPolyline = points.map((p) => `${p.x},${p.ySessions}`).join(" ");
  const growthPolyline = points.map((p) => `${p.x},${p.yGrowth}`).join(" ");

  // Closed polygon for area fills
  const activePolygon = `${points[0].x},${padTop + chartHeight} ${activePolyline} ${points[points.length - 1].x},${padTop + chartHeight}`;
  const sessionsPolygon = `${points[0].x},${padTop + chartHeight} ${sessionsPolyline} ${points[points.length - 1].x},${padTop + chartHeight}`;

  const latestPoint = points[points.length - 1];
  const activeHover = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sapphire-card flex flex-col justify-between transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101828]">
              Tren Pertumbuhan & Aktivitas Belajar
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#EFF4FF] text-[#0B559F] border border-[#B2DDFF] font-semibold">
              {selectedDays} Hari
            </span>
          </div>
          <p className="text-xs text-[#475467] mt-1">
            Perbandingan volume harian antara siswa aktif, aktivitas kuis selesai, dan registrasi baru.
          </p>
        </div>

        {/* Granularity Pills */}
        <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-1 self-start sm:self-auto shrink-0 shadow-xs">
          {(["Harian", "Mingguan", "Bulanan"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setGranularity(opt)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-medium transition-colors select-none",
                granularity === opt
                  ? "bg-[#D1E9FF] text-[#062C54] font-semibold shadow-xs"
                  : "text-[#475467] hover:text-[#101828] hover:bg-[#F1F5F9]"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Legend with Averages */}
      <div className="flex flex-wrap items-center gap-5 text-xs font-mono mb-4 text-[#475467]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-[#0B559F] inline-block shadow-xs" />
          <span>Siswa Aktif (Rata-rata {avgActive.toLocaleString("id-ID")})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-[#0FA97A] inline-block shadow-xs" />
          <span>Latihan / Kuis Selesai (Rata-rata {avgSessions.toLocaleString("id-ID")})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-[#53389E] inline-block shadow-xs" />
          <span>Pengguna Baru (Rata-rata {avgNewUsers.toLocaleString("id-ID")})</span>
        </div>
      </div>

      {/* Area Chart SVG Viewport */}
      <div className="relative w-full h-72">
        <svg
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox={`0 0 ${width} ${height}`}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="sapphirePrimaryArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0B559F" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0B559F" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="sapphireSuccessArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0FA97A" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#0FA97A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Guidelines */}
          <line x1="0" x2={width} y1="20" y2="20" stroke="#E2E8F0" strokeDasharray="4,4" strokeWidth="1" />
          <line x1="0" x2={width} y1="80" y2="80" stroke="#E2E8F0" strokeDasharray="4,4" strokeWidth="1" />
          <line x1="0" x2={width} y1="140" y2="140" stroke="#E2E8F0" strokeDasharray="4,4" strokeWidth="1" />
          <line x1="0" x2={width} y1={padTop + chartHeight} y2={padTop + chartHeight} stroke="#E2E8F0" strokeWidth="1" />

          {/* Sessions Area (Emerald) */}
          <polygon fill="url(#sapphireSuccessArea)" points={sessionsPolygon} />
          <polyline
            fill="none"
            points={sessionsPolyline}
            stroke="#0FA97A"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
          />

          {/* Students Area (Ocean Blue) */}
          <polygon fill="url(#sapphirePrimaryArea)" points={activePolygon} />
          <polyline
            fill="none"
            points={activePolyline}
            stroke="#0B559F"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />

          {/* User Growth Line (Royal Purple dashed) */}
          <polyline
            fill="none"
            points={growthPolyline}
            stroke="#53389E"
            strokeDasharray="3,3"
            strokeLinecap="round"
            strokeWidth="2"
          />

          {/* Pulse Dot on Latest Primary Data Point */}
          {latestPoint && (
            <>
              <circle
                cx={latestPoint.x}
                cy={latestPoint.yActive}
                r="6"
                fill="#0B559F"
                opacity="0.4"
                className="animate-ping"
              />
              <circle cx={latestPoint.x} cy={latestPoint.yActive} r="4" fill="#0B559F" />
            </>
          )}

          {/* Interactive Hover Hit Zones */}
          {points.map((pt, idx) => (
            <rect
              key={idx}
              x={Math.max(0, pt.x - width / points.length / 2)}
              y="0"
              width={width / points.length}
              height={height}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
            />
          ))}

          {/* Hover indicator vertical bar */}
          {activeHover && (
            <line
              x1={activeHover.x}
              x2={activeHover.x}
              y1={padTop}
              y2={padTop + chartHeight}
              stroke="#0B559F"
              strokeDasharray="2,2"
              strokeWidth="1.5"
            />
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeHover && (
          <div
            className="absolute z-20 pointer-events-none -translate-x-1/2 -top-2 bg-[#0F172A] text-white px-3 py-2 rounded-xl shadow-xl text-left border border-slate-700 space-y-1 animate-scale-in"
            style={{
              left: `${(activeHover.x / width) * 100}%`,
            }}
          >
            <p className="text-[10px] font-mono font-bold text-slate-300 border-b border-slate-700/60 pb-1">
              {activeHover.label} ({activeHover.date})
            </p>
            <div className="space-y-0.5 text-[11px] font-mono">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#93C5FD]">Siswa Aktif:</span>
                <span className="font-bold text-white">{activeHover.activeUsers.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#86EFAC]">Kuis Selesai:</span>
                <span className="font-bold text-white">{activeHover.completedSessions.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#D8B4FE]">Pengguna Baru:</span>
                <span className="font-bold text-white">{activeHover.newUsers.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        )}

        {/* X Axis Date Labels */}
        <div className="flex justify-between items-center text-[10px] font-mono text-[#667085] pt-2">
          {points.length > 0 && (
            <>
              <span>{points[0].label}</span>
              {points.length > 3 && <span>{points[Math.floor(points.length / 3)].label}</span>}
              {points.length > 3 && <span>{points[Math.floor((points.length * 2) / 3)].label}</span>}
              <span>Hari Ini</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
