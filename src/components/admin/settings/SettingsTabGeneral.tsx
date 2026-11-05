"use client";

import React from "react";
import {
  Globe,
  Award,
  Sparkles,
  Download,
  UserPlus,
  Server,
  Layers,
  Cpu,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { WebsiteSettings } from "@/types/settings";

interface SettingsTabGeneralProps {
  settings: WebsiteSettings;
  onChange: (updated: Partial<WebsiteSettings>) => void;
}

export const SettingsTabGeneral: React.FC<SettingsTabGeneralProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: General Info Form (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Identitas & Informasi Platform
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              Profil Publik & Kurikulum
            </span>
          </div>

          <div className="space-y-4">
            {/* Nama Platform & Kurikulum */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-600 block font-medium">
                  Nama Platform
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => onChange({ siteName: e.target.value })}
                  placeholder="e.g. NemoLearn"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 font-sans focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-600 block font-medium">
                  Kurikulum Acuan
                </label>
                <input
                  type="text"
                  value={settings.curriculum}
                  onChange={(e) => onChange({ curriculum: e.target.value })}
                  placeholder="e.g. Kurikulum Merdeka SMA"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 font-sans focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-600 block font-medium">
                Tagline Platform
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => onChange({ tagline: e.target.value })}
                placeholder="Platform Latihan Soal Adaptif SMA & AI Generator"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 font-sans focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Deskripsi */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-600 block font-medium">
                Deskripsi Lengkap
              </label>
              <textarea
                rows={3}
                value={settings.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Deskripsi sistem yang tampil di metadata SEO dan dashboard..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-3 font-sans focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              />
              <p className="text-[11px] text-slate-400">
                Deskripsi ini digunakan oleh OpenGraph, crawler mesin pencari, dan halaman publik.
              </p>
            </div>

            {/* Logo URL & Preview */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-mono text-slate-600 block font-medium">
                URL Logo Platform
              </label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo Preview"
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <input
                  type="text"
                  value={settings.logoUrl || "/logo.png"}
                  onChange={(e) => onChange({ logoUrl: e.target.value })}
                  placeholder="/logo.png"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 font-mono focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Telemetry Build Info & Environment (1 Col) */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-slate-500" />
                Metadata Sistem & Build
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-semibold">
                STABLE
              </span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Versi Rilis</span>
                <span className="font-semibold text-slate-800">
                  {settings.appInfo?.version || "v2.4.0-stable"}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Nomor Build</span>
                <span className="font-semibold text-slate-800">
                  {settings.appInfo?.buildNumber || "04.92.11"}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Cluster Node</span>
                <span className="font-semibold text-blue-600">
                  {settings.appInfo?.clusterId || "Cluster-Jakarta"}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Region AWS/Vercel</span>
                <span className="font-semibold text-slate-800">
                  {settings.appInfo?.region || "ap-southeast-3"}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-slate-500">Environment</span>
                <span className="font-semibold text-emerald-600 uppercase">
                  {settings.appInfo?.environment || "production"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              Sinkronisasi Parameter
            </div>
            <p className="text-slate-600 leading-relaxed font-sans">
              Terakhir diperbarui oleh <strong className="font-mono">{settings.updatedBy || "admin"}</strong> pada{" "}
              {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString("id-ID") : "Default Boot"}.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Configuration Matrix Cards */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Konfigurasi Fitur Inti Platform
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            Feature Flag Runtime
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Feature 1: IRT 3-PL */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Award className="w-4 h-4 text-blue-600" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableIRTScoring}
                    onChange={(e) => onChange({ enableIRTScoring: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Skoring IRT 3-PL</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Menghitung skor berdasarkan parameter daya beda, tingkat kesukaran, dan tebakan semu.
              </p>
            </div>
            <span className={`text-[10px] font-mono font-bold ${settings.enableIRTScoring ? "text-emerald-600" : "text-slate-400"}`}>
              {settings.enableIRTScoring ? "● AKTIF" : "○ DINONAKTIFKAN"}
            </span>
          </div>

          {/* Feature 2: AI Question Generator */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAIGenerator}
                    onChange={(e) => onChange({ enableAIGenerator: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <h4 className="text-xs font-bold text-slate-900">AI Soal & Tutor</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mengaktifkan bot tutor interaktif dan generator soal otomatis berbasis kurikulum.
              </p>
            </div>
            <span className={`text-[10px] font-mono font-bold ${settings.enableAIGenerator ? "text-emerald-600" : "text-slate-400"}`}>
              {settings.enableAIGenerator ? "● AKTIF" : "○ DINONAKTIFKAN"}
            </span>
          </div>

          {/* Feature 3: PDF Export */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Download className="w-4 h-4 text-emerald-600" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enablePdfExport}
                    onChange={(e) => onChange({ enablePdfExport: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Ekspor Bank Soal PDF</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Izinkan guru dan siswa mengunduh lembar latihan serta pembahasan dalam format PDF cetak.
              </p>
            </div>
            <span className={`text-[10px] font-mono font-bold ${settings.enablePdfExport ? "text-emerald-600" : "text-slate-400"}`}>
              {settings.enablePdfExport ? "● AKTIF" : "○ DINONAKTIFKAN"}
            </span>
          </div>

          {/* Feature 4: Public Registration */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowPublicRegistration}
                    onChange={(e) => onChange({ allowPublicRegistration: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <h4 className="text-xs font-bold text-slate-900">Registrasi Mandiri Siswa</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Membuka pendaftaran akun siswa baru secara publik tanpa perlu undangan admin khusus.
              </p>
            </div>
            <span className={`text-[10px] font-mono font-bold ${settings.allowPublicRegistration ? "text-emerald-600" : "text-amber-600"}`}>
              {settings.allowPublicRegistration ? "● DIIZINKAN" : "○ DITUTUP (INVITE-ONLY)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
