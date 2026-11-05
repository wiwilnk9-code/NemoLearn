"use client";

import React from "react";
import { Download, Filter, Search, Terminal, AlertCircle } from "lucide-react";
import { TelemetryPayloadItem } from "./AiPayloadInspectorModal";

interface AiRequestStreamTableProps {
  logs: TelemetryPayloadItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  providerFilter: string;
  onProviderFilterChange: (p: string) => void;
  onInspectPayload: (log: TelemetryPayloadItem) => void;
  onExportCsv?: () => void;
  loading?: boolean;
}

export const AiRequestStreamTable: React.FC<AiRequestStreamTableProps> = ({
  logs,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  providerFilter,
  onProviderFilterChange,
  onInspectPayload,
  onExportCsv,
  loading = false,
}) => {
  const getStatusBadge = (log: TelemetryPayloadItem) => {
    if (log.status === "FALLBACK" || log.isFallback) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F1F5F9] text-[#0B559F] border border-[#B2DDFF]">
          Fallback Curated
        </span>
      );
    }
    if (log.status === "PARTIAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF0C7] text-[#B54708] border border-[#FEDF89]">
          Partial Fallback
        </span>
      );
    }
    if (!log.success) {
      if ((log.error || "").includes("429") || (log.error || "").toLowerCase().includes("quota")) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E9D7FE] text-[#53389E] border border-[#D6BBFB]">
            429 Rate Limit
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEE4E2] text-[#D92D20] border border-[#FECDCA]">
          500 Upstream Err
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#0FA97A] border border-[#A6F4C5]">
        200 OK
      </span>
    );
  };

  const formatWibTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Jakarta",
      });
    } catch {
      return isoString;
    }
  };

  const getFeatureLabel = (log: TelemetryPayloadItem) => {
    if (log.subject || log.topic) {
      const type = log.requestType === "explanation_generation" ? "Pembahasan" : "Soal";
      return `${type}: ${log.subject || ""} ${log.topic ? `(${log.topic})` : ""}`.trim();
    }
    if (log.requestType === "explanation_generation") {
      return "Pembahasan Soal Interaktif";
    }
    if (log.requestId?.startsWith("ping_")) {
      return "Health Check (Ping Gateway)";
    }
    return "Generasi Soal Mandiri";
  };

  return (
    <div className="rounded-xl p-5 bg-white border border-[#E2E8F0] shadow-xs flex flex-col space-y-4">
      {/* Table Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101828]">
              Live Request &amp; Error Stream Logs
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-[#E6F4EA] text-[#0FA97A] border border-[#A6F4C5] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0FA97A] mr-1 animate-pulse" />
              Live Feed
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Audit log instan untuk setiap inferensi prompt, validasi latency, dan status respons API.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari ID, model, subjek..."
              className="w-44 sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#101828] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0B559F] font-mono transition-colors"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          </div>

          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => onProviderFilterChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#101828] font-mono focus:outline-none focus:border-[#0B559F]"
          >
            <option value="all">Semua Provider</option>
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
            <option value="compatible">OpenAI-Compatible</option>
            <option value="mock">Nemo Mock/Bank</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[#101828] font-mono focus:outline-none focus:border-[#0B559F]"
          >
            <option value="all">Semua Status</option>
            <option value="SUCCESS">200 OK (Success)</option>
            <option value="FALLBACK">Fallback</option>
            <option value="PARTIAL">Partial</option>
            <option value="FAILED">Error / Failed</option>
          </select>

          {/* Export CSV */}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-mono text-[#101828] border border-[#CBD5E1] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Ekspor</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Element */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="text-[#64748B] uppercase text-[11px] tracking-wider bg-[#F8FAFC] border-y border-[#E2E8F0]">
              <th className="py-2.5 px-3 font-semibold">Waktu (WIB)</th>
              <th className="py-2.5 px-3 font-semibold">Request ID</th>
              <th className="py-2.5 px-3 font-semibold">Model</th>
              <th className="py-2.5 px-3 font-semibold">Fitur Terhubung</th>
              <th className="py-2.5 px-3 font-semibold">Tokens (In/Out)</th>
              <th className="py-2.5 px-3 font-semibold">Latensi</th>
              <th className="py-2.5 px-3 font-semibold">Status Code</th>
              <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#64748B] font-mono">
                  Memuat data stream telemetri...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#64748B] font-mono">
                  Tidak ada request inferensi yang cocok dengan filter saat ini.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => {
                const reqId = log.requestId || `req_${index}`;
                const promptTok = log.tokenUsage?.promptTokens ?? "-";
                const compTok = log.tokenUsage?.completionTokens ?? "-";

                return (
                  <tr
                    key={reqId + index}
                    className="hover:bg-[#F8FAFC] transition-colors group"
                  >
                    <td className="py-3 px-3 text-[#64748B] whitespace-nowrap">
                      {formatWibTime(log.timestamp)}
                    </td>
                    <td
                      className="py-3 px-3 text-[#0B559F] font-semibold truncate max-w-[130px]"
                      title={reqId}
                    >
                      {reqId}
                    </td>
                    <td className="py-3 px-3 text-[#101828] truncate max-w-[120px]" title={log.model}>
                      {log.model}
                    </td>
                    <td
                      className="py-3 px-3 text-[#475467] truncate max-w-[180px]"
                      title={getFeatureLabel(log)}
                    >
                      {getFeatureLabel(log)}
                    </td>
                    <td className="py-3 px-3 text-[#64748B]">
                      <span className="text-[#101828]">{promptTok}</span> /{" "}
                      <span className="text-[#101828]">{compTok}</span>
                    </td>
                    <td
                      className={`py-3 px-3 font-semibold ${
                        (log.latencyMs || 0) > 1000
                          ? "text-[#D92D20]"
                          : (log.latencyMs || 0) > 500
                          ? "text-[#F79009]"
                          : "text-[#0FA97A]"
                      }`}
                    >
                      {log.latencyMs ? `${log.latencyMs} ms` : "0 ms"}
                    </td>
                    <td className="py-3 px-3">{getStatusBadge(log)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onInspectPayload(log)}
                        className="px-2.5 py-1 rounded text-[11px] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#101828] transition-colors border border-[#CBD5E1]"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AiRequestStreamTable;
