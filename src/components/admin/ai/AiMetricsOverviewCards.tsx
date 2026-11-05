"use client";

import React from "react";
import {
  Activity,
  Coins,
  Gauge,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { formatTokenCount, formatCurrencyUsd } from "@/lib/ai/pricing";

interface AiMetricsOverviewCardsProps {
  kpi: {
    totalRequests: number;
    requests24h: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    errorRate: number;
    successRate: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    estimatedTotalCost: number;
    budgetTotal: number;
    budgetUsedPercentage: number;
    failedRequests: number;
  };
}

export const AiMetricsOverviewCards: React.FC<AiMetricsOverviewCardsProps> = ({ kpi }) => {
  const promptPercent =
    kpi.totalTokens > 0 ? Math.round((kpi.totalPromptTokens / kpi.totalTokens) * 100) : 60;
  const compPercent = 100 - promptPercent;

  const latencyTarget = 500;
  const latencyPercent = Math.min(100, Math.round((kpi.p95LatencyMs / latencyTarget) * 100));
  const isLatencyHealthy = kpi.p95LatencyMs <= latencyTarget;

  const isErrorHealthy = kpi.errorRate <= 0.1;
  const remainingBudget = Math.max(0, kpi.budgetTotal - kpi.estimatedTotalCost);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {/* Stat 1: Total Permintaan */}
      <div className="rounded-xl p-4 bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#B2DDFF] transition-all">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#0B559F]/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
        <div className="flex items-center justify-between text-[#64748B] mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#475467] font-medium">
            Total Permintaan
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#0B559F]">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#101828] tracking-tight">
            {kpi.totalRequests.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-flex items-center text-[11px] font-mono text-[#0FA97A] font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {kpi.requests24h.toLocaleString()} req
            </span>
            <span className="text-[10px] text-[#64748B] font-mono">dalam 24 jam</span>
          </div>
        </div>
        <div className="mt-3 w-full bg-[#F1F5F9] rounded-full h-1 overflow-hidden">
          <div
            className="bg-[#0B559F] h-1 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(15, kpi.totalRequests > 0 ? 75 : 0))}%` }}
          />
        </div>
      </div>

      {/* Stat 2: Konsumsi Token */}
      <div className="rounded-xl p-4 bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#B2DDFF] transition-all">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#0B559F]/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
        <div className="flex items-center justify-between text-[#64748B] mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#475467] font-medium">
            Konsumsi Token (Total)
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#0B559F]">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#101828] tracking-tight">
            {formatTokenCount(kpi.totalTokens)}
          </div>
          <div className="text-[11px] font-mono text-[#475467] mt-2 flex items-center justify-between">
            <span className="truncate">
              In: <strong className="text-[#101828]">{formatTokenCount(kpi.totalPromptTokens)}</strong>
            </span>
            <span className="text-[#94A3B8] mx-1">•</span>
            <span className="truncate">
              Out: <strong className="text-[#101828]">{formatTokenCount(kpi.totalCompletionTokens)}</strong>
            </span>
          </div>
        </div>
        <div className="mt-3 flex gap-1 w-full h-1 rounded-full overflow-hidden bg-[#F1F5F9]">
          <div
            className="bg-[#0B559F] h-1 rounded-full"
            style={{ width: `${promptPercent}%` }}
            title={`Prompt: ${promptPercent}%`}
          />
          <div
            className="bg-[#0FA97A] h-1 rounded-full"
            style={{ width: `${compPercent}%` }}
            title={`Completion: ${compPercent}%`}
          />
        </div>
      </div>

      {/* Stat 3: P95 Latency */}
      <div className="rounded-xl p-4 bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#B2DDFF] transition-all">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#0FA97A]/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
        <div className="flex items-center justify-between text-[#64748B] mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#475467] font-medium">
            Rata-rata Latensi (p95)
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#E6F4EA] flex items-center justify-center text-[#0FA97A]">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#101828] tracking-tight">
              {kpi.p95LatencyMs.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-[#64748B]">ms</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLatencyHealthy ? "bg-[#0FA97A]" : "bg-[#F79009]"
              }`}
            />
            <span
              className={`text-[11px] font-mono font-medium ${
                isLatencyHealthy ? "text-[#0FA97A]" : "text-[#B54708]"
              }`}
            >
              {isLatencyHealthy ? "Sehat & Cepat" : "Beban Tinggi"}
            </span>
            <span className="text-[10px] text-[#64748B] font-mono">(&lt;500ms target)</span>
          </div>
        </div>
        <div className="mt-3 w-full bg-[#F1F5F9] rounded-full h-1 overflow-hidden">
          <div
            className={`h-1 rounded-full transition-all duration-500 ${
              isLatencyHealthy ? "bg-[#0FA97A]" : "bg-[#F79009]"
            }`}
            style={{ width: `${Math.min(100, Math.max(10, latencyPercent))}%` }}
          />
        </div>
      </div>

      {/* Stat 4: Error Rate */}
      <div className="rounded-xl p-4 bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#B2DDFF] transition-all">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#D92D20]/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
        <div className="flex items-center justify-between text-[#64748B] mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#475467] font-medium">
            Tingkat Error (SLA)
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isErrorHealthy ? "bg-[#EFF4FF] text-[#0B559F]" : "bg-[#FEE4E2] text-[#D92D20]"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#101828] tracking-tight">
            {kpi.errorRate.toFixed(2)}%
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] font-mono">
            <span className={isErrorHealthy ? "text-[#0FA97A] font-medium" : "text-[#D92D20] font-medium"}>
              Target SLA &lt;0.1%
            </span>
            <span className="text-[#64748B]">{kpi.failedRequests} fail</span>
          </div>
        </div>
        <div className="mt-3 w-full bg-[#F1F5F9] rounded-full h-1 overflow-hidden">
          <div
            className={`h-1 rounded-full transition-all duration-500 ${
              isErrorHealthy ? "bg-[#0FA97A]" : "bg-[#D92D20]"
            }`}
            style={{ width: `${Math.min(100, Math.max(5, kpi.errorRate * 50))}%` }}
          />
        </div>
      </div>

      {/* Stat 5: Budget / Cost Estimation */}
      <div className="rounded-xl p-4 bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between relative overflow-hidden group hover:border-[#B2DDFF] transition-all">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#0B559F]/5 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
        <div className="flex items-center justify-between text-[#64748B] mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#475467] font-medium">
            Estimasi Biaya Berjalan
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#0B559F]">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#101828] tracking-tight">
              {formatCurrencyUsd(kpi.estimatedTotalCost)}
            </span>
            <span className="text-[11px] font-mono text-[#64748B]">
              / ${kpi.budgetTotal}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] font-mono">
            <span className="text-[#475467]">{kpi.budgetUsedPercentage}% batas</span>
            <span className="text-[#64748B]">Sisa: ${remainingBudget.toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-3 w-full bg-[#F1F5F9] rounded-full h-1 overflow-hidden">
          <div
            className="bg-[#0B559F] h-1 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(2, kpi.budgetUsedPercentage))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AiMetricsOverviewCards;
