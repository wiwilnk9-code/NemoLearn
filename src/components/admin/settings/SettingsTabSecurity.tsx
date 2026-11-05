"use client";

import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Download,
  Key,
  Database,
  Clock,
  UserCheck,
  History,
  FileJson,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { WebsiteSettings, GovernanceLogItem } from "@/types/settings";

interface SettingsTabSecurityProps {
  settings: WebsiteSettings;
  governanceLogs: GovernanceLogItem[];
  onChange: (updated: Partial<WebsiteSettings>) => void;
  onDownloadAuditLogs: () => void;
}

export const SettingsTabSecurity: React.FC<SettingsTabSecurityProps> = ({
  settings,
  governanceLogs,
  onChange,
  onDownloadAuditLogs,
}) => {
  const security = settings.security;

  const getStatusBadge = (status: GovernanceLogItem["status"]) => {
    switch (status) {
      case "SUCCESS":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "APPLIED":
        return "text-purple-700 bg-purple-50 border-purple-200";
      case "REDIRECTED":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "FAILED":
        return "text-red-700 bg-red-50 border-red-200";
      case "SECURITY":
        return "text-amber-700 bg-amber-50 border-amber-200";
      default:
        return "text-slate-700 bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Status Matrix Cards from Stitch */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Superadmin MFA */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-mono text-slate-500 font-medium">
              2FA Enforcement
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Enforced
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Superadmin MFA
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Wajib untuk seluruh level akun dengan wewenang modifikasi parameter core atau rotasi API keys.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            Hardware Token: YubiKey / TOTP Authenticator
          </div>
        </div>

        {/* Card 2: WAF & DDoS Shield */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-mono text-slate-500 font-medium">
              WAF & DDoS Mitigation
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Active Shield
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            Vercel Edge Shield
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Pemblokiran IP otomatis jika anomali request terdeteksi dengan mitigasi burst L7 rate-limiting.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            Ruleset: OWASP Core ModSecurity v3.3
          </div>
        </div>

        {/* Card 3: Data Retention & Privacy */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-mono text-slate-500 font-medium">
              Data Privacy Compliance
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              UU PDP & GDPR
            </span>
          </div>
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Retensi Data Interaksi Siswa
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Log interaksi prompt tanya-jawab siswa diredaksi secara otomatis setelah periode retensi 90 hari.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            PVI Masking: SHA-256 Salted Hash
          </div>
        </div>
      </div>

      {/* Session Management & Policy Card */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            Tata Kelola Masa Sesi (Session Management)
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            HMAC-SHA256 Token Policy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-700 block font-medium">
              Masa Aktif Token Sesi Administrator (Hari)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="30"
                value={security.sessionLifetimeDays}
                onChange={(e) =>
                  onChange({
                    security: {
                      ...security,
                      sessionLifetimeDays: parseInt(e.target.value) || 7,
                    },
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              />
              <span className="text-xs font-mono text-slate-500 shrink-0">
                hari
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sesi login kedaluwarsa secara otomatis dan mewajibkan autentikasi ulang.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-700 block font-medium">
              Retensi Log Audit (Hari)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="30"
                max="365"
                value={security.dataRetentionDays}
                onChange={(e) =>
                  onChange({
                    security: {
                      ...security,
                      dataRetentionDays: parseInt(e.target.value) || 90,
                    },
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              />
              <span className="text-xs font-mono text-slate-500 shrink-0">
                hari
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Periode penyimpanan histori audit trail sebelum pengarsipan dingin.
            </p>
          </div>
        </div>
      </div>

      {/* Governance Events Audit Log Table from Stitch */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              Catatan Tata Kelola Sistem (Governance Audit Log)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Riwayat perubahan parameter platform, rotasi kunci API, mutasi kuota, dan status lockdown.
            </p>
          </div>

          <button
            type="button"
            onClick={onDownloadAuditLogs}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-600" />
            <span>Download Audit Log (JSON)</span>
          </button>
        </div>

        {/* Table representation matching Stitch */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Waktu (WIB)</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Operator / Aktor</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px]">Aktivitas / Mutasi Konfigurasi</th>
                <th className="py-2.5 px-3 font-semibold uppercase text-[10px] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {governanceLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    Belum ada rekaman audit tata kelola sistem.
                  </td>
                </tr>
              ) : (
                governanceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("id-ID", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {log.operator}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 max-w-md truncate">
                      {log.activity}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
