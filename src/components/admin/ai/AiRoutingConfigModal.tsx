"use client";

import React, { useState } from "react";
import {
  X,
  Sliders,
  Sparkles,
  Zap,
  Globe,
  Database,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { AIProviderType } from "@/types/ai";

interface AiRoutingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: AIProviderType;
  currentModel: string;
  currentBaseUrl?: string;
  currentTimeoutMs?: number;
  hasStoredKey?: boolean;
  maskedKey?: string;
  onSave: (settings: {
    provider: AIProviderType;
    model: string;
    apiKey?: string;
    baseUrl?: string;
    timeoutMs: number;
  }) => Promise<boolean>;
  onTest: (testData: {
    provider: AIProviderType;
    model: string;
    apiKey?: string;
    baseUrl?: string;
    timeoutMs: number;
  }) => Promise<{ success: boolean; message: string; latencyMs?: number }>;
}

export const AiRoutingConfigModal: React.FC<AiRoutingConfigModalProps> = ({
  isOpen,
  onClose,
  currentProvider,
  currentModel,
  currentBaseUrl = "",
  currentTimeoutMs = 20000,
  hasStoredKey = false,
  maskedKey = "",
  onSave,
  onTest,
}) => {
  const [provider, setProvider] = useState<AIProviderType>(currentProvider);
  const [model, setModel] = useState(currentModel);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(currentBaseUrl);
  const [timeoutSec, setTimeoutSec] = useState(Math.round(currentTimeoutMs / 1000));
  const [showKey, setShowKey] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProviderChange = (newProvider: AIProviderType) => {
    setProvider(newProvider);
    setTestResult(null);
    setErrorMsg(null);
    if (newProvider === "gemini") {
      setModel("gemini-1.5-flash");
      setBaseUrl("");
    } else if (newProvider === "openai") {
      setModel("gpt-4o-mini");
      setBaseUrl("https://api.openai.com/v1");
    } else if (newProvider === "openrouter") {
      setModel("meta-llama/llama-3.3-70b-instruct");
      setBaseUrl("https://openrouter.ai/api/v1");
    } else if (newProvider === "openai-compatible") {
      setModel("llama-3.3-70b-versatile");
      setBaseUrl("https://api.groq.com/openai/v1");
    } else {
      setModel("curated-sma-bank-v1");
      setBaseUrl("");
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setErrorMsg(null);
    try {
      const res = await onTest({
        provider,
        model,
        apiKey: apiKey.trim().length > 0 ? apiKey.trim() : "keep_existing",
        baseUrl: provider === "openai-compatible" ? baseUrl : undefined,
        timeoutMs: timeoutSec * 1000,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Gagal menguji koneksi provider.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const ok = await onSave({
        provider,
        model,
        apiKey: apiKey.trim().length > 0 ? apiKey.trim() : "keep_existing",
        baseUrl: provider === "openai-compatible" ? baseUrl : undefined,
        timeoutMs: timeoutSec * 1000,
      });
      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan konfigurasi routing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#0B559F]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#101828]">Ubah Routing Provider AI</h3>
              <p className="text-xs text-[#64748B]">
                Pilih engine inferensi utama dan tentukan prioritas failover.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#101828] p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Provider Selection Tabs */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-medium text-[#475467] uppercase">
            Pilih Provider Utama
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: "gemini" as AIProviderType, name: "Google Gemini", icon: Sparkles },
              { id: "openai" as AIProviderType, name: "OpenAI", icon: Zap },
              { id: "openrouter" as AIProviderType, name: "OpenRouter", icon: Globe },
              { id: "openai-compatible" as AIProviderType, name: "Groq / Other", icon: Globe },
              { id: "mock" as AIProviderType, name: "Nemo Local Bank", icon: Database },
            ].map((p) => {
              const Icon = p.icon;
              const isSelected = provider === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleProviderChange(p.id)}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2 transition-all ${
                    isSelected
                      ? "border-[#0B559F] bg-[#EFF4FF] text-[#0B559F] font-semibold ring-1 ring-[#0B559F]/20"
                      : "border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475467]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-mono">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Model Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-medium text-[#475467] uppercase">
            Model AI
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="e.g. gemini-1.5-flash, gpt-4o-mini"
            className="w-full px-3 py-2 text-xs rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#101828] font-mono focus:outline-none focus:border-[#0B559F]"
          />
        </div>

        {/* API Key Input */}
        {provider !== "mock" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-medium text-[#475467] uppercase">
                API Key
              </label>
              {hasStoredKey && (
                <span className="text-[10px] font-mono text-[#0FA97A]">
                  Tersimpan: {maskedKey}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={hasStoredKey ? "Kosongkan jika tetap gunakan key tersimpan" : "Masukkan API Key baru..."}
                className="w-full pl-3 pr-10 py-2 text-xs rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#101828] font-mono focus:outline-none focus:border-[#0B559F]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475467]"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-[#64748B] font-mono flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#0FA97A]" />
              Key dienkripsi dan disimpan di server, tidak pernah dibocorkan ke client.
            </p>
          </div>
        )}

        {/* Base URL (Khusus OpenAI Compatible) */}
        {provider === "openai-compatible" && (
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-medium text-[#475467] uppercase">
              Base URL (SSRF Protected)
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.groq.com/openai/v1"
              className="w-full px-3 py-2 text-xs rounded-lg bg-[#F8FAFC] border border-[#CBD5E1] text-[#101828] font-mono focus:outline-none focus:border-[#0B559F]"
            />
          </div>
        )}

        {/* Timeout */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-medium text-[#475467] uppercase">
            Timeout Request ({timeoutSec} detik)
          </label>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={timeoutSec}
            onChange={(e) => setTimeoutSec(Number(e.target.value))}
            className="w-full accent-[#0B559F]"
          />
        </div>

        {/* Test Result Callout */}
        {testResult && (
          <div
            className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
              testResult.success
                ? "bg-[#E6F4EA] text-[#0FA97A] border border-[#A6F4C5]"
                : "bg-[#FEE4E2] text-[#D92D20] border border-[#FECDCA]"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0FA97A]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D92D20]" />
            )}
            <span className="truncate">
              {testResult.success
                ? `Koneksi Berhasil! Latensi: ${testResult.latencyMs || 0} ms`
                : testResult.message}
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 rounded-lg text-xs font-mono bg-[#FEE4E2] text-[#D92D20] border border-[#FECDCA]">
            {errorMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || saving}
            className="px-3 py-1.5 text-xs font-mono font-medium text-[#101828] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg transition-colors border border-[#CBD5E1] flex items-center gap-1.5"
          >
            {testing && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B559F]" />}
            <span>{testing ? "Menguji..." : "Uji Koneksi"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-[#475467] hover:bg-[#F1F5F9] rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving || testing}
              className="px-4 py-1.5 text-xs font-medium text-white bg-[#0B559F] hover:bg-[#08427B] rounded-lg transition-all shadow-xs flex items-center gap-1.5"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? "Menyimpan..." : "Terapkan Routing"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiRoutingConfigModal;
