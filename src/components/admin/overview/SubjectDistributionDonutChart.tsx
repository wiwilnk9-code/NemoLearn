"use client";

import React, { useState } from "react";
import { PieChart } from "lucide-react";
import { QuestionBankAnalytics } from "@/types/admin";
import { cn } from "@/lib/utils";

interface SubjectDistributionDonutChartProps {
  questionBank?: QuestionBankAnalytics;
  totalSessions?: number;
}

const PALETTE = [
  "#0B559F", // Ocean Blue
  "#067BC2", // Cerulean Cyan
  "#53389E", // Royal Purple
  "#0FA97A", // Emerald Green
  "#F97066", // Coral
  "#667085", // Slate
];

export const SubjectDistributionDonutChart: React.FC<SubjectDistributionDonutChartProps> = ({
  questionBank,
  totalSessions = 0,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const rawSubjects = questionBank?.bySubject || [];
  const totalQuestions = rawSubjects.reduce((sum, s) => sum + s.total, 0);

  // Take top 4 subjects and group rest as "Lainnya"
  const top4 = rawSubjects.slice(0, 4);
  const remaining = rawSubjects.slice(4);
  const remainingTotal = remaining.reduce((sum, s) => sum + s.total, 0);

  const subjects = [...top4];
  if (remainingTotal > 0) {
    subjects.push({
      subjectId: "lainnya",
      subjectName: "Lainnya & Vokasi",
      total: remainingTotal,
      hotsCount: remaining.reduce((sum, s) => sum + s.hotsCount, 0),
      percentage: totalQuestions > 0 ? Math.round((remainingTotal / totalQuestions) * 100) : 0,
    });
  }

  // Calculate SVG stroke-dasharray and stroke-dashoffset
  // Circumference for r=38 is 2 * PI * 38 ≈ 238.76
  const circumference = 238.76;
  let accumulatedOffset = 0;

  const slices = subjects.map((sub, idx) => {
    const fraction = totalQuestions > 0 ? sub.total / totalQuestions : 0.25;
    const strokeDash = fraction * circumference;
    const offset = -accumulatedOffset;
    accumulatedOffset += strokeDash;

    return {
      ...sub,
      color: PALETTE[idx % PALETTE.length],
      strokeDasharray: `${strokeDash.toFixed(1)} ${circumference.toFixed(1)}`,
      strokeDashoffset: offset.toFixed(1),
      percentage: totalQuestions > 0 ? Math.round(fraction * 100) : 25,
    };
  });

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sapphire-card flex flex-col justify-between transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[#101828]">
            Distribusi Mata Pelajaran
          </h2>
          <p className="text-xs text-[#475467] mt-0.5">
            Proporsi materi dan bank soal aktif kurikulum SMA.
          </p>
        </div>
        <span className="p-2 rounded-lg bg-[#EFF4FF] text-[#0B559F] border border-[#B2DDFF]">
          <PieChart className="w-4 h-4" />
        </span>
      </div>

      {/* Donut Visual SVG */}
      <div className="flex items-center justify-center relative py-4">
        <svg className="w-44 h-44 -rotate-90 overflow-visible" viewBox="0 0 100 100">
          {/* Background circle track */}
          <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="14" />

          {/* Donut Slices */}
          {slices.map((slice, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <circle
                key={slice.subjectId}
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke={slice.color}
                strokeWidth={isHovered ? 16 : 14}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085]">
            Total Butir Soal
          </span>
          <span className="text-xl font-bold font-sans tracking-tight text-[#101828] tabular-nums">
            {totalQuestions.toLocaleString("id-ID")}
          </span>
          {totalSessions > 0 && (
            <span className="text-[10px] font-mono text-[#0B559F]">
              {totalSessions.toLocaleString("id-ID")} sesi
            </span>
          )}
        </div>
      </div>

      {/* Custom Legends */}
      <div className="space-y-2.5 pt-2 border-t border-[#F1F5F9]">
        {slices.length === 0 ? (
          <p className="text-xs text-[#667085] text-center py-2 font-mono">Belum ada kategori mata pelajaran.</p>
        ) : (
          slices.map((slice, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={slice.subjectId}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={cn(
                  "flex items-center justify-between text-xs p-1.5 rounded-lg transition-colors cursor-pointer",
                  isHovered ? "bg-[#F8FAFC]" : ""
                )}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-[#101828] font-medium truncate">
                    {slice.subjectName}
                  </span>
                </div>
                <div className="font-mono text-[#101828] font-semibold shrink-0">
                  {slice.percentage}%{" "}
                  <span className="text-[10px] text-[#667085] font-normal">
                    ({slice.total.toLocaleString("id-ID")})
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
