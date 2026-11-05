"use client";

import React from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
} from "lucide-react";
import { WebsiteSettings } from "@/types/settings";

interface SettingsTabMaintenanceProps {
  settings: WebsiteSettings;
  onChange: (updated: Partial<WebsiteSettings>) => void;
}

export const SettingsTabMaintenance: React.FC<SettingsTabMaintenanceProps> = ({
  settings,
  onChange,
}) => {
  const maintenance = settings.maintenance;
  const isEnabled = maintenance.enabled;

  return (
    <div className="space-y-6">
      <div
        className={`p-6 rounded-xl border transition-all ${
          isEnabled
            ? "bg-red-50/70 border-red-200 shadow-sm"
            : "bg-white border-slate-200 shadow-2xs"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                isEnabled ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-500"
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs font-bold ${
                    isEnabled ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {isEnabled ? "STATUS: AKTIF (LOCKDOWN)" : "STATUS: NON-AKTIF (NORMAL)"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-mono">
                  Sistem Berjalan Normal
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Mode Pemeliharaan Platform Darurat
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Gunakan fitur ini hanya saat migrasi database kritis, pembaruan skema besar, atau insiden keamanan platform.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
            <span className="text-xs font-mono font-medium text-slate-600">
              {isEnabled ? "Kunci Akses Sistem" : "Aktifkan Lockdown"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) =>
                  onChange({
                    maintenanceMode: e.target.checked,
                    maintenance: {
                      ...maintenance,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>

        {/* Scope & Configuration Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* Radio Cakupan */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-600 block font-semibold">
              Cakupan Isolasi Sistem
            </label>
            <div className="space-y-2.5">
              <label
                className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  maintenance.scope === "all"
                    ? "bg-red-50/50 border-red-300"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="maintenanceScope"
                  value="all"
                  checked={maintenance.scope === "all"}
                  onChange={() =>
                    onChange({
                      maintenance: {
                        ...maintenance,
                        scope: "all",
                      },
                    })
                  }
                  className="mt-1 accent-red-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Seluruh Platform NemoLearn (Total Lock)
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Semua portal ditutup; web, mobile app API gateway, autentikasi terhenti kecuali IP Superadmin terdaftar.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  maintenance.scope === "ai-only"
                    ? "bg-amber-50/50 border-amber-300"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="maintenanceScope"
                  value="ai-only"
                  checked={maintenance.scope === "ai-only"}
                  onChange={() =>
                    onChange({
                      maintenance: {
                        ...maintenance,
                        scope: "ai-only",
                      },
                    })
                  }
                  className="mt-1 accent-amber-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Hanya Fitur AI Chatbot & Generator
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Siswa tetap dapat membaca materi dan mengerjakan tugas statis. Hanya modul komputasi LLM yang ditangguhkan.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Pesan Publik & Estimasi */}
          <div className="space-y-3">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-600 block font-semibold">
              Pesan Publik untuk Siswa & Guru
            </label>
            <textarea
              rows={3}
              value={maintenance.message}
              onChange={(e) =>
                onChange({
                  maintenance: {
                    ...maintenance,
                    message: e.target.value,
                  },
                })
              }
              placeholder="Masukkan alasan pemeliharaan yang akan tampil di halaman error 503..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-3 font-sans focus:outline-none focus:bg-white focus:border-red-400 transition-colors"
            />
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 font-mono">Estimasi Selesai (WIB):</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="time"
                  value={maintenance.estimatedEndTime || "14:00"}
                  onChange={(e) =>
                    onChange({
                      maintenance: {
                        ...maintenance,
                        estimatedEndTime: e.target.value,
                      },
                    })
                  }
                  className="bg-slate-50 border border-slate-200 text-slate-900 font-mono px-3 py-1 rounded text-xs focus:outline-none focus:bg-white focus:border-red-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Superadmin Whitelist Bypass Notice */}
        <div className="mt-6 p-3.5 rounded-lg bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-slate-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              IP Superadmin Anda saat ini (103.148.12.9) telah terdaftar di whitelist bypass darurat.
            </span>
          </div>
          <span className="text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 shrink-0 self-start sm:self-auto">
            Bypass Safe
          </span>
        </div>
      </div>
    </div>
  );
};
