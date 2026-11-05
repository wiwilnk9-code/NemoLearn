"use client";

import React from "react";
import Link from "next/link";
import { Users, Zap, Layers, BookOpen, Cpu, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { AdminDashboardStats, FullAdminAnalytics } from "@/types/admin";
import { cn } from "@/lib/utils";

interface OverviewKpiCardsProps {
  stats: AdminDashboardStats;
  analytics?: FullAdminAnalytics;
}

export const OverviewKpiCards: React.FC<OverviewKpiCardsProps> = ({
  stats,
  analytics,
}) => {
  const { users, questions, sessions, ai } = stats;

  // Total Pengguna & Delta
  const totalUsersFormatted = users.total.toLocaleString("id-ID");
  const newUsersCount = users.newUsers || 0;
  const userGrowthRate = users.total > 0
    ? ((newUsersCount / Math.max(1, users.total - newUsersCount)) * 100).toFixed(1)
    : "0.0";
  const activeUserPercent = users.total > 0
    ? Math.round((users.active / users.total) * 100)
    : 0;

  // Active Users (DAU / MAU)
  const activeUsersFormatted = users.active.toLocaleString("id-ID");

  // Questions
  const totalQuestionsFormatted = questions.total.toLocaleString("id-ID");
  const hotsCount = questions.hots || 0;
  const hotsPercent = questions.total > 0
    ? Math.round((hotsCount / questions.total) * 100)
    : 0;
  const publishedPercent = questions.total > 0
    ? Math.round((questions.published / questions.total) * 100)
    : 0;

  // Learning Activity (Sessions)
  const totalSessionsFormatted = sessions.total.toLocaleString("id-ID");
  const completionRate = sessions.total > 0
    ? Math.round((sessions.completed / sessions.total) * 100)
    : 0;

  // AI Requests & Tokens
  const totalAiRequestsFormatted = ai.totalRequests.toLocaleString("id-ID");
  const aiSuccessRate = ai.totalRequests > 0
    ? Number((((ai.successfulRequests) / ai.totalRequests) * 100).toFixed(1))
    : 100;
  // Estimate tokens: ~850 tokens per request on average
  const estimatedTokensM = ((ai.totalRequests * 850) / 1000000).toFixed(1);
  const estimatedCost = ((ai.totalRequests * 850 * 0.0000015)).toFixed(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Card 1: Pengguna Terdaftar (Sapphire Ocean Blue) */}
      <Link href="/admin/users" className="block group">
        <div className="relative overflow-hidden bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sapphire-card group-hover:shadow-sapphire-hover group-hover:bg-[#F8FAFC] transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#475467] font-semibold">
                Pengguna Terdaftar
              </span>
              <span className="p-2 rounded-lg bg-[#D1E9FF] text-[#0B559F] border border-[#B2DDFF] group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight text-[#101828] tabular-nums">
              {totalUsersFormatted}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-[#0B559F]">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="font-semibold">+{userGrowthRate}%</span>
              <span className="text-[#667085] text-[11px]">({newUsersCount} baru)</span>
            </div>
          </div>
          <div className="w-full bg-[#EFF4FF] h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-[#0B559F] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(activeUserPercent, 12)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Card 2: Pengguna Aktif (Cerulean Cyan) */}
      <Link href="/admin/users" className="block group">
        <div className="relative overflow-hidden bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sapphire-card group-hover:shadow-sapphire-hover group-hover:bg-[#F8FAFC] transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#475467] font-semibold">
                Pengguna Aktif (DAU)
              </span>
              <span className="p-2 rounded-lg bg-[#E0F2FE] text-[#067BC2] border border-[#BAE6FD] group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight text-[#101828] tabular-nums">
              {activeUsersFormatted}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-[#067BC2]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#067BC2] animate-pulse" />
              <span className="font-semibold">{activeUserPercent}%</span>
              <span className="text-[#667085] text-[11px]">rasio aktif</span>
            </div>
          </div>
          <div className="w-full bg-[#EFF4FF] h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-[#067BC2] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(activeUserPercent, 10)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Card 3: Total Bank Soal (Sapphire Ocean Blue) */}
      <Link href="/admin/questions" className="block group">
        <div className="relative overflow-hidden bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sapphire-card group-hover:shadow-sapphire-hover group-hover:bg-[#F8FAFC] transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#475467] font-semibold">
                Bank Soal SMA
              </span>
              <span className="p-2 rounded-lg bg-[#D1E9FF] text-[#0B559F] border border-[#B2DDFF] group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight text-[#101828] tabular-nums">
              {totalQuestionsFormatted}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-[#0B559F]">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span className="font-semibold">{hotsPercent}% HOTS</span>
              <span className="text-[#667085] text-[11px]">({hotsCount} butir)</span>
            </div>
          </div>
          <div className="w-full bg-[#EFF4FF] h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-[#0B559F] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(publishedPercent, 20)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Card 4: Total Aktivitas Belajar (Emerald Green) */}
      <Link href="/admin/sessions" className="block group">
        <div className="relative overflow-hidden bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sapphire-card group-hover:shadow-sapphire-hover group-hover:bg-[#F8FAFC] transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#475467] font-semibold">
                Aktivitas Belajar
              </span>
              <span className="p-2 rounded-lg bg-[#D1FADF] text-[#0FA97A] border border-[#A6F4C5] group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight text-[#101828] tabular-nums">
              {totalSessionsFormatted}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-[#0FA97A]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-semibold">{completionRate}% Selesai</span>
              <span className="text-[#667085] text-[11px]">({sessions.completed} sesi)</span>
            </div>
          </div>
          <div className="w-full bg-[#EFF4FF] h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-[#0FA97A] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(completionRate, 15)}%` }}
            />
          </div>
        </div>
      </Link>

      {/* Card 5: Total AI Requests & Tokens (Royal Purple) */}
      <Link href="/admin/ai-settings" className="block group">
        <div className="relative overflow-hidden bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sapphire-card group-hover:shadow-sapphire-hover group-hover:bg-[#F8FAFC] transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#475467] font-semibold">
                Permintaan AI
              </span>
              <span className="p-2 rounded-lg bg-[#E9D7FE] text-[#53389E] border border-[#D6BBFB] group-hover:scale-105 transition-transform">
                <Cpu className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-bold font-sans tracking-tight text-[#101828] tabular-nums">
              {totalAiRequestsFormatted}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-[#53389E]">
              <span className="font-semibold">~{estimatedTokensM}M Token</span>
              <span className="text-[#667085] text-[11px]">(~${estimatedCost})</span>
            </div>
          </div>
          <div className="w-full bg-[#EFF4FF] h-1.5 rounded-full mt-4 overflow-hidden">
            <div
              className="bg-[#53389E] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(aiSuccessRate, 20)}%` }}
            />
          </div>
        </div>
      </Link>
    </div>
  );
};
