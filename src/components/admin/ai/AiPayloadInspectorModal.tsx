"use client";

import React, { useState } from "react";
import { Code, X, Copy, Check, Terminal, ExternalLink } from "lucide-react";

export interface TelemetryPayloadItem {
  timestamp: string;
  provider: string;
  model: string;
  success: boolean;
  latencyMs?: number;
  error?: string;
  requestId?: string;
  requestType?: "question_generation" | "explanation_generation";
  depth?: string;
  cacheHit?: boolean;
  subject?: string;
  topic?: string;
  subtopic?: string;
  questionCount?: number;
  generatedCount?: number;
  status?: "SUCCESS" | "PARTIAL" | "FAILED" | "FALLBACK";
  retryCount?: number;
  isFallback?: boolean;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

interface AiPayloadInspectorModalProps {
  isOpen: boolean;
  payload: TelemetryPayloadItem | null;
  onClose: () => void;
}

export const AiPayloadInspectorModal: React.FC<AiPayloadInspectorModalProps> = ({
  isOpen,
  payload,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !payload) return null;

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#EFF4FF] flex items-center justify-center text-[#0B559F]">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#101828]">Payload Inspector:</span>{" "}
              <span className="font-mono text-xs text-[#0B559F] font-semibold">
                {payload.requestId || "req_anonymous"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] hover:text-[#101828] p-1 rounded-lg hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-lg">
          <div>
            <span className="text-[#64748B] block text-[10px]">Status</span>
            <span
              className={`font-semibold ${
                payload.success ? "text-[#0FA97A]" : "text-[#D92D20]"
              }`}
            >
              {payload.status || (payload.success ? "SUCCESS" : "FAILED")}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px]">Model</span>
            <span className="text-[#101828] font-medium truncate block">{payload.model}</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px]">Latensi</span>
            <span className="text-[#0B559F] font-semibold">{payload.latencyMs || 0} ms</span>
          </div>
          <div>
            <span className="text-[#64748B] block text-[10px]">Tokens (In/Out)</span>
            <span className="text-[#101828]">
              {payload.tokenUsage?.promptTokens || "-"} /{" "}
              {payload.tokenUsage?.completionTokens || "-"}
            </span>
          </div>
        </div>

        {/* Error Callout if any */}
        {payload.error && (
          <div className="p-3 bg-[#FEE4E2] border border-[#FECDCA] rounded-lg text-xs font-mono text-[#D92D20]">
            <strong className="block mb-0.5">Error Reason / Trace:</strong>
            {payload.error}
          </div>
        )}

        {/* JSON Viewer */}
        <div className="bg-[#0F172A] p-3 rounded-lg font-mono text-xs text-[#E2E8F0] overflow-x-auto max-h-64 leading-relaxed border border-[#334155] select-text">
          <pre>{jsonString}</pre>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs font-mono text-[#64748B] pt-1">
          <span>Route: direct • SSL TLSv1.3</span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#101828] text-xs font-medium transition-colors border border-[#CBD5E1]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#0FA97A]" />
                <span className="text-[#0FA97A]">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin JSON</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiPayloadInspectorModal;
