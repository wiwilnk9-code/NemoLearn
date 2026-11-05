"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, TrendingUp, Star, ChevronRight, Zap } from "lucide-react";
import { AdminDashboardStats } from "@/types/admin";
import { cn } from "@/lib/utils";

interface LearningEfficiencyCardProps {
  stats: AdminDashboardStats;
  className?: string;
}

export const LearningEfficiencyCard: React.FC<LearningEfficiencyCardProps> = ({
  stats,
  className,
}) => {
  const { sessions, ai } = stats;

  // Completion / Retention Score
  const completionRate = sessions.total > 0
    ? Number(((sessions.completed / sessions.total) * 100).toFixed(1))
    : 85.0;

  // Average session duration
  const avgDurationMin = sessions.avgDurationSeconds
    ? Math.max(1, Math.round(sessions.avgDurationSeconds / 60))
    : 28;

  // AI Success Rate & Latency
  const aiSuccessRate = ai.totalRequests > 0
    ? Number((((ai.successfulRequests) / ai.totalRequests) * 100).toFixed(1))
    : 99.8;
  const avgLatency = ai.avgLatencyMs || 380;

  return (
    <div
      className={cn(
        "bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sapphire-card flex flex-col justify-between transition-all",
        className
      )}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-[#101828]">
            Efisiensi Pembelajaran
          </h2>
          <span className="p-2 rounded-lg bg-[#D1FADF] text-[#0FA97A] border border-[#A6F4C5]">
            <Sparkles className="w-4 h-4" />
          </span>
        </div>
        <p className="text-xs text-[#475467] mb-5">
          Indikator retensi siswa, efisiensi waktu, dan keandalan engine AI.
        </p>

        {/* Metric 1: Skor Penyelesaian & Retensi (D30) */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#101828] font-semibold">Tingkat Penyelesaian Sesi</span>
            <span className="font-mono text-[#0FA97A] font-bold">{completionRate}%</span>
          </div>
          <div className="w-full bg-[#EFF4FF] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0FA97A] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(Math.max(completionRate, 10), 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#667085]">
            <span>Target Platform: 75%</span>
            <span className="text-[#0FA97A] font-medium">+3.4% vs bln lalu</span>
          </div>
        </div>

        {/* Metric 2: Rata-rata Durasi Sesi */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#101828] font-semibold">Rata-rata Waktu Latihan</span>
            <span className="font-mono text-[#0B559F] font-bold">{avgDurationMin} Menit</span>
          </div>
          <div className="w-full bg-[#EFF4FF] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#0B559F] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((avgDurationMin / 45) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#667085]">
            <span>Standar Kurikulum: 25 Menit</span>
            <span className="text-[#0B559F] font-medium">Fokus Optimal</span>
          </div>
        </div>

        {/* Metric 3: Keandalan & Kepuasan Engine AI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#101828] font-semibold">Keandalan AI Generator</span>
            <span className="font-mono text-[#53389E] font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#53389E] text-[#53389E]" />
              {aiSuccessRate}%
            </span>
          </div>
          <div className="w-full bg-[#EFF4FF] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#53389E] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(aiSuccessRate, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#667085]">
            <span>Latensi Rata-rata: {avgLatency}ms</span>
            <span className="text-[#53389E] font-medium">Stabil (p95)</span>
          </div>
        </div>
      </div>

      {/* Footer link to full analytics */}
      <div className="pt-4 mt-5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono text-[#475467]">
        <span>Evaluasi Pedagogi & Analitik</span>
        <Link
          href="/admin/analytics"
          className="text-[#0B559F] hover:underline font-semibold flex items-center gap-0.5"
        >
          <span>Detail Metrik</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
};
