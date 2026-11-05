"use client";

import React, { useState } from "react";
import {
  Bot,
  Sliders,
  Key,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Cpu,
  Layers,
  ArrowRightLeft,
} from "lucide-react";
import { WebsiteSettings, MaskedApiVaultItem } from "@/types/settings";
import { ApiKeyRotateModal } from "./ApiKeyRotateModal";

interface SettingsTabAiProps {
  settings: WebsiteSettings;
  apiVault: MaskedApiVaultItem[];
  onChange: (updated: Partial<WebsiteSettings>) => void;
  onRefreshApiVault: () => void;
}

export const SettingsTabAi: React.FC<SettingsTabAiProps> = ({
  settings,
  apiVault,
  onChange,
  onRefreshApiVault,
}) => {
  const [rotateTarget, setRotateTarget] = useState<MaskedApiVaultItem | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    provider: string;
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const aiRouting = settings.aiRouting;

  const handleTestConnection = async (item: MaskedApiVaultItem) => {
    setTestingProvider(item.provider);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/ai/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerType:
            item.provider === "gemini"
              ? "gemini"
              : item.provider === "openai"
              ? "openai"
              : item.provider === "openrouter"
              ? "openai-compatible"
              : "openai",
          model: item.model,
          apiKey: "keep_existing",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Uji koneksi gagal.");
      }

      setTestResult({
        provider: item.name,
        success: data.success,
        message: data.message || `Status 200 OK (Latency: ${data.latencyMs}ms)`,
        latencyMs: data.latencyMs,
      });
    } catch (err: any) {
      setTestResult({
        provider: item.name,
        success: false,
        message: err.message || "Gagal menghubungi server endpoint provider.",
      });
    } finally {
      setTestingProvider(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Status Matrix (Telemetry Grid from Stitch) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model Health Card 1: Primary Engine */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-500">Primary Engine</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Optimal
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-base font-semibold text-slate-900">
                {aiRouting.primaryModel === "gemini-1.5-flash"
                  ? "Gemini 1.5 Flash (Google)"
                  : aiRouting.primaryModel === "claude-3-5-sonnet"
                  ? "Claude 3.5 Sonnet (Anthropic)"
                  : "GPT-4o Mini (OpenAI)"}
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Avg Latency: 320ms</span>
                <span className="text-emerald-600 font-semibold">99.98% uptime</span>
              </div>
            </div>
          </div>
          {/* Sparkline */}
          <div className="mt-3 pt-2">
            <svg className="w-full h-6 text-emerald-500" fill="none" viewBox="0 0 100 24">
              <path
                d="M0 16 L12 14 L24 18 L36 10 L48 12 L60 8 L72 13 L84 6 L96 9 L100 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>
        </div>

        {/* Model Health Card 2: Fallback Tier-1 */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-500">Fallback Tier-1</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Ready
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-base font-semibold text-slate-900">
                Claude 3.5 Sonnet (Anthropic)
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Avg Latency: 480ms</span>
                <span className="text-blue-600 font-semibold">Standby Sync</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2">
            <svg className="w-full h-6 text-blue-500" fill="none" viewBox="0 0 100 24">
              <path
                d="M0 18 L15 15 L30 14 L45 19 L60 11 L75 13 L90 7 L100 9"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>
        </div>

        {/* Model Health Card 3: High-Context Routing */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-500">High-Context Routing</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                Batch Mode
              </span>
            </div>
            <div className="space-y-1">
              <div className="text-base font-semibold text-slate-900">
                Gemini 1.5 Flash (Google)
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>Context: 1M Tokens</span>
                <span className="text-emerald-600 font-semibold">Cost Opt. 74%</span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2">
            <svg className="w-full h-6 text-purple-500" fill="none" viewBox="0 0 100 24">
              <path
                d="M0 12 L18 16 L36 12 L54 14 L72 10 L88 15 L100 11"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Provider Config Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Model Routing & Latency Rules */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              Default Model Routing Policy
            </h2>
            <span className="text-[11px] font-mono text-slate-500">
              Dynamic Failover
            </span>
          </div>

          {/* Primary Model Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-700 block font-medium">
              Primary Default Model
            </label>
            <div className="relative">
              <select
                value={aiRouting.primaryModel}
                onChange={(e) =>
                  onChange({
                    aiRouting: {
                      ...aiRouting,
                      primaryModel: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 font-mono appearance-none focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              >
                <option value="gpt-4o-mini">OpenAI — GPT-4o-mini (Revisi Cepat & Hemat Biaya)</option>
                <option value="claude-3-5-sonnet">Anthropic — Claude 3.5 Sonnet (Analisis Soal Sulit)</option>
                <option value="gemini-1-5-flash">Google — Gemini 1.5 Flash (Kecepatan Ekstrem & 1M Konteks)</option>
                <option value="llama-3.3-70b-versatile">OpenRouter — Llama 3.3 70B (Open-Weights Fallback)</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              Digunakan oleh seluruh endpoint chat tutor interaktif dan kalkulasi petunjuk otomatis.
            </p>
          </div>

          {/* Auto-Switch Toggle */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-900">
                Fallback Provider Auto-Switch
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Secara otomatis mengalihkan request ke model alternatif jika latency model primer melebihi 1500ms atau terjadi respon HTTP 5xx.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={aiRouting.fallbackAutoSwitch}
                onChange={(e) =>
                  onChange({
                    aiRouting: {
                      ...aiRouting,
                      fallbackAutoSwitch: e.target.checked,
                    },
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Temperature Sliders */}
          <div className="space-y-4 pt-1">
            <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              Kontrol Suhu (Temperature Sliders)
            </h3>

            {/* Slider 1: Friendly Tutor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600">Friendly Tutor & Pembahasan</span>
                <span className="font-semibold text-blue-600">
                  {aiRouting.tutorTemperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={aiRouting.tutorTemperature}
                onChange={(e) =>
                  onChange({
                    aiRouting: {
                      ...aiRouting,
                      tutorTemperature: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0.0 (Kaku/Deterministik)</span>
                <span>0.7 (Rekomendasi)</span>
                <span>1.0 (Kreatif)</span>
              </div>
            </div>

            {/* Slider 2: Exam & IRT Generator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-600">Generator Ujian & Silabus IRT (Ketat)</span>
                <span className="font-semibold text-indigo-600">
                  {aiRouting.examTemperature.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={aiRouting.examTemperature}
                onChange={(e) =>
                  onChange({
                    aiRouting: {
                      ...aiRouting,
                      examTemperature: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>0.0 (Presisi Mutlak)</span>
                <span>0.2 (Rekomendasi)</span>
                <span>1.0 (Variatif)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: API Management Vault */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                API Management Vault
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                AES-256 GCM
              </span>
            </div>

            {/* Test result toast if any */}
            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
                  testResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>
                    <strong>{testResult.provider}:</strong> {testResult.message}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTestResult(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Key List from apiVault */}
            <div className="space-y-3">
              {apiVault.map((item) => {
                const isTesting = testingProvider === item.provider;
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.isSet ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        ></span>
                        {item.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {item.lastRotatedText}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={item.maskedKey}
                        className="w-full font-mono text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded text-slate-700 focus:outline-none"
                      />
                      <button
                        type="button"
                        disabled={isTesting}
                        onClick={() => handleTestConnection(item)}
                        className="px-2.5 py-1.5 rounded text-[11px] font-mono bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 transition-colors whitespace-nowrap shadow-2xs disabled:opacity-50 flex items-center gap-1"
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                            <span>Menguji...</span>
                          </>
                        ) : (
                          <span>Test Koneksi</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotateTarget(item)}
                        title="Rotasi Kunci API"
                        className="p-1.5 rounded text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-100 text-[11px] text-slate-600 flex items-center gap-2 border border-slate-200">
            <Lock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Semua token dienkripsi saat istirahat (at-rest) menggunakan modul Cloud KMS HSM FIPS 140-2 Level 3.
            </span>
          </div>
        </div>
      </div>

      {/* Api Key Rotation Modal */}
      <ApiKeyRotateModal
        isOpen={Boolean(rotateTarget)}
        onClose={() => setRotateTarget(null)}
        targetProvider={rotateTarget}
        onRotateSuccess={() => {
          onRefreshApiVault();
        }}
      />
    </div>
  );
};
