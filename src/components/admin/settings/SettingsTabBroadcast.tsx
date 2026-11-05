"use client";

import React from "react";
import {
  Megaphone,
  Radio,
  Send,
  Eye,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Smartphone,
  Calendar,
  Users,
} from "lucide-react";
import { WebsiteSettings, BroadcastCategory, BroadcastAudience } from "@/types/settings";

interface SettingsTabBroadcastProps {
  settings: WebsiteSettings;
  onChange: (updated: Partial<WebsiteSettings>) => void;
  onPublish: () => void;
  onWithdraw: () => void;
}

export const SettingsTabBroadcast: React.FC<SettingsTabBroadcastProps> = ({
  settings,
  onChange,
  onPublish,
  onWithdraw,
}) => {
  const broadcast = settings.broadcast;

  const getCategoryStyles = (cat: BroadcastCategory) => {
    switch (cat) {
      case "critical":
        return {
          bg: "bg-red-50 border-red-200 text-red-900",
          icon: <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />,
          dot: "bg-red-500",
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-900",
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
          dot: "bg-amber-500",
        };
      case "success":
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
          dot: "bg-emerald-500",
        };
      default:
        return {
          bg: "bg-blue-50 border-blue-200 text-blue-900",
          icon: <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />,
          dot: "bg-blue-600",
        };
    }
  };

  const previewStyle = getCategoryStyles(broadcast.category);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form Controls (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600" />
              Konfigurasi Siaran Global
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Real-time Push
            </span>
          </div>

          {/* Isi Pesan Pengumuman */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono text-slate-700 font-medium">
                Isi Pesan Pengumuman
              </label>
              <span
                className={`text-[11px] font-mono ${
                  broadcast.message.length > 130
                    ? "text-red-500 font-bold"
                    : "text-slate-400"
                }`}
              >
                {broadcast.message.length}/140 karakter
              </span>
            </div>
            <input
              type="text"
              maxLength={140}
              value={broadcast.message}
              onChange={(e) =>
                onChange({
                  broadcast: {
                    ...broadcast,
                    message: e.target.value,
                  },
                })
              }
              placeholder="e.g. Pembaruan Fitur: Generator Soal Ujian Nasional kini mendukung Kurikulum Merdeka!"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 font-sans focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
            <p className="text-[11px] text-slate-400">
              Maksimum 140 karakter untuk menjaga keterbacaan di layar ponsel cerdas.
            </p>
          </div>

          {/* Color Flavor Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-700 block font-medium">
              Kategori / Tingkat Kepentingan (Warna Banner)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Info (Blue) */}
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-colors ${
                  broadcast.category === "info"
                    ? "bg-blue-50/70 border-blue-300"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="bannerColor"
                  value="info"
                  checked={broadcast.category === "info"}
                  onChange={() =>
                    onChange({
                      broadcast: { ...broadcast, category: "info" },
                    })
                  }
                  className="accent-blue-600"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span className="text-xs font-mono text-slate-800 font-medium">Info</span>
              </label>

              {/* Success (Green) */}
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-colors ${
                  broadcast.category === "success"
                    ? "bg-emerald-50/70 border-emerald-300"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="bannerColor"
                  value="success"
                  checked={broadcast.category === "success"}
                  onChange={() =>
                    onChange({
                      broadcast: { ...broadcast, category: "success" },
                    })
                  }
                  className="accent-emerald-600"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-xs font-mono text-slate-800 font-medium">Sukses</span>
              </label>

              {/* Warning (Yellow) */}
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-colors ${
                  broadcast.category === "warning"
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="bannerColor"
                  value="warning"
                  checked={broadcast.category === "warning"}
                  onChange={() =>
                    onChange({
                      broadcast: { ...broadcast, category: "warning" },
                    })
                  }
                  className="accent-amber-600"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-xs font-mono text-slate-800 font-medium">Peringatan</span>
              </label>

              {/* Critical (Red) */}
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-colors ${
                  broadcast.category === "critical"
                    ? "bg-red-50/70 border-red-300"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="bannerColor"
                  value="critical"
                  checked={broadcast.category === "critical"}
                  onChange={() =>
                    onChange({
                      broadcast: { ...broadcast, category: "critical" },
                    })
                  }
                  className="accent-red-600"
                />
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span className="text-xs font-mono text-slate-800 font-medium">Kritis</span>
              </label>
            </div>
          </div>

          {/* Schedule & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-700 block font-medium">
                Target Audiens
              </label>
              <select
                value={broadcast.audience}
                onChange={(e) =>
                  onChange({
                    broadcast: {
                      ...broadcast,
                      audience: e.target.value as BroadcastAudience,
                    },
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 font-mono appearance-none focus:outline-none focus:bg-white focus:border-blue-500"
              >
                <option value="all">Semua Pengguna (Siswa & Guru)</option>
                <option value="teachers">Hanya Guru & Institusi</option>
                <option value="students">Hanya Akun Siswa</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-700 block font-medium">
                Kadaluarsa Siaran Otomatis
              </label>
              <input
                type="date"
                value={broadcast.expiresAt}
                onChange={(e) =>
                  onChange({
                    broadcast: {
                      ...broadcast,
                      expiresAt: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right: Preview Simulation & Actions (1 Col) */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                Pratinjau Tampilan Siswa
              </h3>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  broadcast.active
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {broadcast.active ? "STATUS: LIVE" : "STATUS: DRAF/OFF"}
              </span>
            </div>

            {/* Mobile Preview Mockup */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                </div>
                <span className="text-[9px] font-mono text-slate-400">
                  App Mobile Simulator
                </span>
              </div>

              {/* Banner Inside Device */}
              <div
                className={`p-2.5 rounded-lg border flex items-start gap-2 shadow-2xs ${previewStyle.bg}`}
              >
                {previewStyle.icon}
                <span className="text-[11px] leading-snug font-medium">
                  {broadcast.message || "Pemberitahuan Sistem NemoLearn..."}
                </span>
              </div>

              {/* Dummy skeleton content for realism */}
              <div className="space-y-2 pt-2 opacity-35">
                <div className="h-3 bg-slate-300 rounded w-3/4"></div>
                <div className="h-8 bg-slate-300 rounded w-full"></div>
                <div className="h-8 bg-slate-300 rounded w-5/6"></div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onPublish}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Siarkan Sekarang</span>
            </button>
            <button
              type="button"
              onClick={onWithdraw}
              disabled={!broadcast.active}
              className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 text-xs font-mono transition-colors"
            >
              Tarik Siaran (Nonaktifkan)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
