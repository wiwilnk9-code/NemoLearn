"use client";

import React, { useState } from "react";
import {
  FileText,
  RefreshCw,
  Download,
  Calendar,
  Radio,
  Pause,
  ChevronDown,
  FileSpreadsheet,
  FileJson,
} from "lucide-react";

interface LogsHeaderProps {
  ledgerId: string;
  isLiveTail: boolean;
  onToggleLiveTail: () => void;
  dateRange: "24h" | "7d" | "30d" | "all";
  onDateRangeChange: (range: "24h" | "7d" | "30d" | "all") => void;
  onRefresh: () => void;
  refreshing: boolean;
  onExport: (format: "csv" | "json") => void;
}

export const LogsHeader: React.FC<LogsHeaderProps> = ({
  ledgerId,
  isLiveTail,
  onToggleLiveTail,
  dateRange,
  onDateRangeChange,
  onRefresh,
  refreshing,
  onExport,
}) => {
  const [exportOpen, setExportOpen] = useState(false);

  const dateRangeLabels: Record<string, string> = {
    "24h": "24 Jam Terakhir",
    "7d": "7 Hari Terakhir",
    "30d": "30 Hari Terakhir",
    all: "Semua Waktu",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2">
        {/* Title & Subsystem Tag */}
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] tracking-widest uppercase font-semibold">
              Immutable Audit Stream
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs font-mono text-slate-500">
              Ledger ID: {ledgerId}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Pusat Pemantauan Aktivitas & Audit Trail Forensik
          </h1>
          <p className="text-sm text-slate-600">
            Rekam jejak forensik seluruh mutasi data, autentikasi sesi, rotasi kunci keamanan, dan eskalasi role di platform NemoLearn.
          </p>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Live Tail Toggle */}
          <button
            type="button"
            onClick={onToggleLiveTail}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all border shadow-2xs ${
              isLiveTail
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
            title="Aktifkan pembaruan log otomatis tiap 5 detik"
          >
            {isLiveTail ? (
              <>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Stream</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-400" />
                <span>Dijeda</span>
              </>
            )}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            title="Muat ulang log"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-blue-600" : ""}`} />
          </button>

          {/* Date Range Selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value as any)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-mono rounded-lg pl-8 pr-8 py-2 focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
            >
              <option value="24h">24 Jam Terakhir</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="all">Semua Waktu</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-mono font-semibold text-white transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Audit Trail</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {exportOpen && (
              <div
                className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30 font-mono text-xs"
                onMouseLeave={() => setExportOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    onExport("csv");
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Format CSV (.csv)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    onExport("json");
                  }}
                  className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileJson className="w-4 h-4 text-blue-600" />
                  <span>Format JSON Forensik (.json)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
