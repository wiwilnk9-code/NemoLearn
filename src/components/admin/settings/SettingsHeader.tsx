"use client";

import React from "react";
import {
  RotateCcw,
  CheckCircle2,
  Megaphone,
  Radio,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { BroadcastConfig } from "@/types/settings";

interface SettingsHeaderProps {
  buildNumber: string;
  clusterId: string;
  broadcast: BroadcastConfig;
  onResetDefaults: () => void;
  onSave: () => void;
  saving: boolean;
  onNavigateToBroadcastTab: () => void;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  buildNumber,
  clusterId,
  broadcast,
  onResetDefaults,
  onSave,
  saving,
  onNavigateToBroadcastTab,
}) => {
  const getFlavorStyles = (cat: BroadcastConfig["category"]) => {
    switch (cat) {
      case "critical":
        return "bg-red-50 text-red-700 border-red-200";
      case "warning":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getBadgeStyles = (cat: BroadcastConfig["category"]) => {
    switch (cat) {
      case "critical":
        return "bg-red-500 text-white";
      case "warning":
        return "bg-amber-500 text-white";
      case "success":
        return "bg-emerald-500 text-white";
      default:
        return "bg-blue-600 text-white";
    }
  };

  return (
    <div className="space-y-4">
      {/* Live Broadcast Preview Ambient Bar */}
      {broadcast.active && (
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs shadow-sm transition-all ${getFlavorStyles(
            broadcast.category
          )}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider shrink-0 ${getBadgeStyles(
                broadcast.category
              )}`}
            >
              SIARAN AKTIF ({broadcast.category.toUpperCase()})
            </span>
            <span className="truncate font-medium text-slate-800">
              {broadcast.message || "Pemberitahuan Sistem NemoLearn..."}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <span className="text-[11px] font-mono opacity-80 hidden md:inline">
              Audiens: {broadcast.audience === "all" ? "Semua Pengguna" : broadcast.audience === "teachers" ? "Hanya Guru" : "Hanya Siswa"}
            </span>
            <button
              type="button"
              onClick={onNavigateToBroadcastTab}
              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/80 hover:bg-white text-slate-800 transition-colors shadow-2xs flex items-center gap-1 font-mono"
            >
              <span>Edit Siaran</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header with Subsystem Tag & Save Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] tracking-widest uppercase font-semibold">
              Governance Engine
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs font-mono text-slate-500">
              Build {buildNumber} // {clusterId}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Pengaturan Sistem & Konfigurasi Platform
          </h1>
          <p className="text-sm text-slate-600">
            Kelola provider AI, batas kuota rate limiting, mode pemeliharaan darurat, siaran pengumuman, dan tata kelola keamanan dalam satu panel terpusat.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onResetDefaults}
            disabled={saving}
            className="px-3.5 py-2 rounded-lg text-xs font-medium font-mono text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Kembalikan semua parameter ke konfigurasi awal platform"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Default</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-xs font-semibold font-mono text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm hover:shadow disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
