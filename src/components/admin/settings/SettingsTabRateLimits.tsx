"use client";

import React from "react";
import {
  Gauge,
  Infinity,
  Zap,
  Building2,
  Clock,
  FileUp,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { WebsiteSettings } from "@/types/settings";

interface SettingsTabRateLimitsProps {
  settings: WebsiteSettings;
  onChange: (updated: Partial<WebsiteSettings>) => void;
}

export const SettingsTabRateLimits: React.FC<SettingsTabRateLimitsProps> = ({
  settings,
  onChange,
}) => {
  const rateLimits = settings.rateLimits;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Siswa Reguler Gratis (Free Tier) */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-medium">
                Free Tier
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 font-semibold">
                Default Siswa
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Siswa Reguler Gratis
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pengaturan pembatasan konsumsi token harian untuk mencegah eksploitasi API publik dan pemborosan kuota.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-700 block font-medium">
                Limit Tanya Jawab AI (Per Hari)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={rateLimits.freeTier.dailyPromptLimit}
                  onChange={(e) =>
                    onChange({
                      rateLimits: {
                        ...rateLimits,
                        freeTier: {
                          ...rateLimits.freeTier,
                          dailyPromptLimit: parseInt(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                />
                <span className="text-xs font-mono text-slate-500 shrink-0">
                  prompt/hari
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-700 block font-medium">
                Maksimal Kuis AI Mandiri
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={rateLimits.freeTier.weeklyQuizLimit}
                  onChange={(e) =>
                    onChange({
                      rateLimits: {
                        ...rateLimits,
                        freeTier: {
                          ...rateLimits.freeTier,
                          weeklyQuizLimit: parseInt(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                />
                <span className="text-xs font-mono text-slate-500 shrink-0">
                  kuis/minggu
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono flex items-center justify-between">
              <span>Cooldown antar sesi:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={rateLimits.freeTier.cooldownSeconds}
                  onChange={(e) =>
                    onChange({
                      rateLimits: {
                        ...rateLimits,
                        freeTier: {
                          ...rateLimits.freeTier,
                          cooldownSeconds: parseInt(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="w-16 bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded text-xs text-right font-mono"
                />
                <span>detik</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-mono text-emerald-700 font-medium">
              Status Kuota: Aktif Berjalan ({rateLimits.freeTier.activeAccountsCount?.toLocaleString("id-ID") || "41.2k"} Akun)
            </span>
          </div>
        </div>

        {/* Tier 2: Siswa Pro / Berlangganan (Pro Tier) */}
        <div className="p-6 rounded-xl bg-white border border-blue-200 shadow-2xs flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-blue-600 font-semibold">
                Pro Tier
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 font-semibold">
                Siswa Berlangganan
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Siswa Pro / Premium
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Akses tanya-jawab tak terbatas dengan perlindungan burst throttling untuk stabilitas microservice.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-blue-900 block">
                  Kuota Harian Unlimited
                </span>
                <span className="text-[10px] text-blue-700 font-mono">
                  Fair Usage Policy (FUP) Diaktifkan
                </span>
              </div>
              <Infinity className="w-5 h-5 text-blue-600" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-700 block font-medium">
                Burst Limit Per Menit
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={rateLimits.proTier.burstLimitPerMinute}
                  onChange={(e) =>
                    onChange({
                      rateLimits: {
                        ...rateLimits,
                        proTier: {
                          ...rateLimits.proTier,
                          burstLimitPerMinute: parseInt(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                />
                <span className="text-xs font-mono text-slate-500 shrink-0">
                  req/menit
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-800 block">
                  Auto-Burst Queueing
                </span>
                <span className="text-[10px] text-slate-500">
                  Tahan request 2 detik daripada drop 429
                </span>
              </div>
              <input
                type="checkbox"
                checked={rateLimits.proTier.autoBurstQueueing}
                onChange={(e) =>
                  onChange({
                    rateLimits: {
                      ...rateLimits,
                      proTier: {
                        ...rateLimits.proTier,
                        autoBurstQueueing: e.target.checked,
                      },
                    },
                  })
                }
                className="w-4 h-4 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-mono text-blue-600 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              Prioritas Jalur: Fast-Lane QoS
            </span>
          </div>
        </div>

        {/* Tier 3: Guru & Institusi (Enterprise Tier) */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-purple-600 font-semibold">
                Enterprise
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-100 text-purple-800 font-semibold">
                Guru & Kampus
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Guru & Institusi Pendidikan
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Kapasitas komputasi massal untuk pembuatan silabus, rubrik penilaian, dan bank soal serentak.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-700 block font-medium">
                Batch Generator Kuis Sekaligus
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={rateLimits.enterpriseTier.batchQuizLimit}
                  onChange={(e) =>
                    onChange({
                      rateLimits: {
                        ...rateLimits,
                        enterpriseTier: {
                          ...rateLimits.enterpriseTier,
                          batchQuizLimit: parseInt(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                />
                <span className="text-xs font-mono text-slate-500 shrink-0">
                  soal/batch
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-700 block font-medium">
                Batas Upload Dokumen Modul (RAG)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="1024"
                  value={rateLimits.enterpriseTier.maxUploadMb}
                  onChange={(e) =>
                    onChange({
                      rateLimits: {
                        ...rateLimits,
                        enterpriseTier: {
                          ...rateLimits.enterpriseTier,
                          maxUploadMb: parseInt(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
                />
                <span className="text-xs font-mono text-slate-500 shrink-0">
                  MB/file
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
              Vector Search Dedikasi: 1536 dims pgvector cluster
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-mono text-purple-600 font-semibold">
              Prioritas Layanan: Dedicated QoS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
