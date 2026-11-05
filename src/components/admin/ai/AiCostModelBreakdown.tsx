"use client";

import React from "react";
import { Download, Sparkles, Database } from "lucide-react";
import { formatTokenCount, formatCurrencyUsd } from "@/lib/ai/pricing";

export interface ModelUsageBreakdownItem {
  model: string;
  provider: string;
  count: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  percentage: number;
  purpose: string;
}

interface AiCostModelBreakdownProps {
  models: ModelUsageBreakdownItem[];
  totalCost: number;
  onExportCsv?: () => void;
}

export const AiCostModelBreakdown: React.FC<AiCostModelBreakdownProps> = ({
  models,
  totalCost,
  onExportCsv,
}) => {
  // Model color palette
  const getColor = (index: number) => {
    const palette = [
      "bg-[#0B559F]", // Sapphire Primary
      "bg-[#0FA97A]", // Emerald
      "bg-[#53389E]", // Purple
      "bg-[#F79009]", // Amber
      "bg-[#64748B]", // Slate
    ];
    return palette[index % palette.length];
  };

  return (
    <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-[#101828]">Breakdown Biaya &amp; Model</h3>
          <span className="text-xs font-mono text-[#0B559F] font-bold">
            {formatCurrencyUsd(totalCost)}
          </span>
        </div>
        <p className="text-xs text-[#64748B] mb-5">
          Distribusi estimasi pengeluaran komputasi berdasarkan model AI yang aktif.
        </p>

        {/* Model rows */}
        <div className="space-y-4">
          {models.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#64748B] font-mono">
              Belum ada riwayat inferensi model tercatat.
            </div>
          ) : (
            models.map((m, idx) => {
              const barColor = getColor(idx);

              return (
                <div key={m.model}>
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className="text-[#101828] font-medium flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded ${barColor}`} />
                      <span className="truncate max-w-[140px]">{m.model}</span>
                    </span>
                    <span className="text-[#64748B]">
                      <strong className="text-[#101828]">{m.percentage}%</strong> •{" "}
                      {formatCurrencyUsd(m.cost)}
                    </span>
                  </div>

                  <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${barColor} transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(3, m.percentage))}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-[#64748B] mt-0.5">
                    <span>{formatTokenCount(m.totalTokens)} tokens</span>
                    <span className="truncate max-w-[150px] text-right" title={m.purpose}>
                      {m.purpose}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Caching Efficiency Box & CSV Download */}
      <div className="mt-6 pt-3 bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono text-[#64748B] block">Efisiensi Caching Bank</span>
          <span className="text-xs font-mono font-semibold text-[#0FA97A]">
            Zero-Token Reused Ready
          </span>
        </div>
        {onExportCsv && (
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono bg-white hover:bg-[#F1F5F9] text-[#101828] border border-[#CBD5E1] rounded transition-colors shadow-xs"
          >
            <Download className="w-3 h-3 text-[#64748B]" />
            <span>Download CSV</span>
          </button>
        )}
      </div>
    </div>
  );
};
