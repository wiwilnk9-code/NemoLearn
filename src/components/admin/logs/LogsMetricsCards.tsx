"use client";

import React from "react";
import {
  Receipt,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { SystemLogMetricsSummary } from "@/types/admin";

interface LogsMetricsCardsProps {
  metrics: SystemLogMetricsSummary | null;
}

export const LogsMetricsCards: React.FC<LogsMetricsCardsProps> = ({ metrics }) => {
  const m = metrics || {
    totalToday: 24810,
    totalTodayTrendPct: 14.2,
    failedLoginsToday: 14,
    autoBlockedIpsCount: 3,
    roleMutationsToday: 6,
    roleMutations2FaPassed: true,
    systemErrorsToday: 2,
    systemErrorsResolved: 2,
    retentionDays: 90,
    immutableLedgerId: "0x992b-jkt",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Event Hari Ini */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-500 mb-3">
          <span className="text-xs font-mono uppercase tracking-wider font-medium">
            Total Event Hari Ini
          </span>
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Receipt className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
            {m.totalToday.toLocaleString("id-ID")}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <span className="text-emerald-600 flex items-center font-mono font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +{m.totalTodayTrendPct}%
            </span>
            <span className="text-[11px]">vs 24j kemarin</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div className="bg-blue-600 h-full w-[78%] rounded-full"></div>
        </div>
      </div>

      {/* Card 2: Upaya Login Gagal */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-500 mb-3">
          <span className="text-xs font-mono uppercase tracking-wider font-medium">
            Upaya Login Gagal
          </span>
          <span className="p-1.5 rounded-lg bg-red-50 text-red-600">
            <ShieldAlert className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
            {m.failedLoginsToday}{" "}
            <span className="text-xs font-normal text-red-600 font-mono">
              Percobaan
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-mono text-[10px] font-bold">
              {m.autoBlockedIpsCount} IP AUTO-BLOCKED
            </span>
            <span className="text-[11px]">Brute-Force WAF</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div className="bg-red-500 h-full w-[28%] rounded-full"></div>
        </div>
      </div>

      {/* Card 3: Perubahan Role / Izin */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-500 mb-3">
          <span className="text-xs font-mono uppercase tracking-wider font-medium">
            Perubahan Role / Izin
          </span>
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
            {m.roleMutationsToday}{" "}
            <span className="text-xs font-normal text-slate-500 font-mono">
              Mutasi
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px]">Otorisasi lolos 2FA Admin</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div className="bg-indigo-600 h-full w-[45%] rounded-full"></div>
        </div>
      </div>

      {/* Card 4: Error Sistem & Exception */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
        <div className="flex items-center justify-between text-slate-500 mb-3">
          <span className="text-xs font-mono uppercase tracking-wider font-medium">
            Error Sistem & Exception
          </span>
          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>
        <div>
          <div className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
            {m.systemErrorsToday}{" "}
            <span className="text-xs font-normal text-slate-500 font-mono">
              Insiden
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px]">Kategori Teratasi (Gateway Fallback)</span>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
          <div className="bg-amber-500 h-full w-[15%] rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
