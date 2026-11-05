"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Globe,
  Database,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  Key,
  RefreshCw,
  Sliders,
  Check,
} from "lucide-react";
import { AIProviderType } from "@/types/ai";

export interface ProviderHealthItem {
  id: string;
  name: string;
  providerType: AIProviderType;
  shortTag: string;
  model: string;
  hasKey: boolean;
  maskedKey: string;
  isPrimary: boolean;
  avgLatencyMs: number;
  successRate: number;
  rateLimit: string;
  primaryFunction: string;
  fallbackTier: string;
  status: "active" | "standby" | "unconfigured" | "error";
  baseUrl?: string;
}

interface AiProviderHealthMatrixProps {
  providers: ProviderHealthItem[];
  onPingProvider: (providerType: AIProviderType) => Promise<{
    success: boolean;
    latencyMs?: number;
    message?: string;
  }>;
  onSelectPrimary?: (providerType: AIProviderType) => void;
  onOpenSettings?: () => void;
}

export const AiProviderHealthMatrix: React.FC<AiProviderHealthMatrixProps> = ({
  providers,
  onPingProvider,
  onSelectPrimary,
  onOpenSettings,
}) => {
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<
    Record<string, { success: boolean; latencyMs?: number; message?: string }>
  >({});

  const handlePing = async (p: ProviderHealthItem) => {
    setPingingId(p.id);
    try {
      const res = await onPingProvider(p.providerType);
      setPingResults((prev) => ({
        ...prev,
        [p.id]: res,
      }));
    } finally {
      setPingingId(null);
    }
  };

  const getProviderIcon = (shortTag: string) => {
    switch (shortTag) {
      case "GM":
        return <Sparkles className="w-4 h-4 text-[#0B559F]" />;
      case "OA":
        return <Zap className="w-4 h-4 text-[#53389E]" />;
      case "GW":
        return <Globe className="w-4 h-4 text-[#0FA97A]" />;
      case "NM":
      default:
        return <Database className="w-4 h-4 text-[#0B559F]" />;
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#101828]">
            Kesehatan Provider AI &amp; Dynamic Routing
          </h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#EFF4FF] text-[#0B559F] border border-[#B2DDFF]">
            {providers.length} Terhubung
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#64748B] hidden sm:inline-block">
            Auto-failover enabled via Zero-Loss Policy
          </span>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#0B559F] bg-white border border-[#B2DDFF] rounded-lg hover:bg-[#EFF4FF] transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Konfigurasi Key</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {providers.map((p) => {
          const isPinging = pingingId === p.id;
          const pingResult = pingResults[p.id];

          return (
            <div
              key={p.id}
              className={`rounded-xl p-4 bg-white border shadow-xs flex flex-col justify-between transition-all ${
                p.isPrimary
                  ? "border-[#0B559F] ring-1 ring-[#0B559F]/20"
                  : "border-[#E2E8F0] hover:border-[#CBD5E1]"
              }`}
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] border border-[#B2DDFF] flex items-center justify-center font-mono font-bold text-xs">
                      {getProviderIcon(p.shortTag)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-[#101828] leading-tight">
                          {p.name}
                        </h3>
                      </div>
                      <p className="text-[11px] font-mono text-[#64748B]">{p.model}</p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div>
                    {p.isPrimary ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#E6F4EA] text-[#0FA97A] border border-[#A6F4C5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0FA97A] animate-pulse" />
                        PRIMARY
                      </span>
                    ) : p.status === "standby" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#EFF4FF] text-[#0B559F] border border-[#B2DDFF]">
                        STANDBY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                        BELUM DISET
                      </span>
                    )}
                  </div>
                </div>

                {/* Details box */}
                <div className="mt-4 space-y-2 bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-lg">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#64748B]">Latensi Rata-rata</span>
                    <span className="text-[#101828] font-semibold">
                      {p.avgLatencyMs > 0 ? `${p.avgLatencyMs} ms` : "0 ms (Lokal)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#64748B]">Tingkat Sukses</span>
                    <span className="text-[#0FA97A] font-semibold">{p.successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#64748B]">Fungsi Utama</span>
                    <span className="text-[#101828] text-[11px] truncate max-w-[140px]" title={p.primaryFunction}>
                      {p.primaryFunction}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#64748B]">API Key</span>
                    <span className="text-[#64748B] text-[10px] truncate max-w-[130px]">
                      {p.hasKey ? (
                        <span className="text-[#0FA97A]">{p.maskedKey}</span>
                      ) : (
                        <span className="text-[#F79009]">Tidak ada key</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Ping Result Banner */}
                {pingResult && (
                  <div
                    className={`mt-2 p-2 rounded-lg text-[11px] font-mono flex items-center justify-between ${
                      pingResult.success
                        ? "bg-[#E6F4EA] text-[#0FA97A] border border-[#A6F4C5]"
                        : "bg-[#FEE4E2] text-[#D92D20] border border-[#FECDCA]"
                    }`}
                  >
                    <span className="truncate">
                      {pingResult.success
                        ? `Ping OK (${pingResult.latencyMs || 0}ms)`
                        : pingResult.message || "Ping Gagal"}
                    </span>
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-[#64748B] truncate max-w-[110px]" title={p.rateLimit}>
                  {p.rateLimit}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePing(p)}
                    disabled={isPinging || (!p.hasKey && p.providerType !== "mock")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] disabled:opacity-50 text-[11px] text-[#101828] transition-colors"
                    title="Uji latency dan koneksi server AI"
                  >
                    <RefreshCw className={`w-3 h-3 ${isPinging ? "animate-spin" : ""}`} />
                    <span>{isPinging ? "Ping..." : "Ping"}</span>
                  </button>

                  {!p.isPrimary && onSelectPrimary && (
                    <button
                      onClick={() => onSelectPrimary(p.providerType)}
                      disabled={!p.hasKey && p.providerType !== "mock"}
                      className="px-2 py-1 rounded bg-[#0B559F] hover:bg-[#08427B] disabled:opacity-40 text-white text-[11px] font-medium transition-colors"
                      title="Jadikan provider utama"
                    >
                      Aktifkan
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiProviderHealthMatrix;
