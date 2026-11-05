"use client";

import React, { useState } from "react";
import {
  Code,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  Terminal,
  Globe,
  Key,
  Megaphone,
  LogIn,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SystemLog } from "@/types/admin";

interface LogsTableProps {
  logs: SystemLog[];
  loading: boolean;
  onInspectLog: (log: SystemLog) => void;
}

export const LogsTable: React.FC<LogsTableProps> = ({
  logs,
  loading,
  onInspectLog,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const getActionIcon = (action: string, category?: string) => {
    const act = action.toUpperCase();
    if (act.includes("LOGIN") || act.includes("AUTH")) {
      return <LogIn className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (act.includes("ROLE")) {
      return <User className="w-3.5 h-3.5 text-indigo-600" />;
    }
    if (act.includes("SETTING") || act.includes("RATE")) {
      return <Terminal className="w-3.5 h-3.5 text-purple-600" />;
    }
    if (act.includes("KEY") || act.includes("ENKRIPSI")) {
      return <Key className="w-3.5 h-3.5 text-amber-600" />;
    }
    if (act.includes("SIARAN") || act.includes("BROADCAST")) {
      return <Megaphone className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (act.includes("EXCEPTION") || act.includes("WARN")) {
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    }
    if (act.includes("BLOCK") || act.includes("SECURITY")) {
      return <ShieldAlert className="w-3.5 h-3.5 text-red-600" />;
    }
    return <Terminal className="w-3.5 h-3.5 text-slate-500" />;
  };

  const getStatusBadge = (status?: string, level?: string) => {
    const st = (status || "").toUpperCase();
    if (st === "SUKSES") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          SUKSES
        </span>
      );
    }
    if (st === "BLOCKED" || st === "BLOCKED 24J") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-red-600 text-white font-bold tracking-wide">
          <Lock className="w-3 h-3" />
          BLOCKED
        </span>
      );
    }
    if (st === "TERATASI") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
          TERATASI
        </span>
      );
    }
    if (st === "PERINGATAN" || level === "warn") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
          PERINGATAN
        </span>
      );
    }
    if (st === "GAGAL" || level === "error") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-red-50 text-red-700 border border-red-200 font-semibold">
          GAGAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 font-medium">
        {st || "INFO"}
      </span>
    );
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      const timeStr = d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const dateStr = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return { timeStr, dateStr };
    } catch {
      return { timeStr: iso, dateStr: "" };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 text-[11px] font-mono uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 font-semibold">Waktu (WIB)</th>
              <th className="py-3 px-4 font-semibold">Aktor / Pengguna</th>
              <th className="py-3 px-4 font-semibold">Jenis Aktivitas</th>
              <th className="py-3 px-4 font-semibold max-w-xs">Detail Mutasi</th>
              <th className="py-3 px-4 font-semibold">IP & Lokasi</th>
              <th className="py-3 px-4 font-semibold text-center">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Aksi Forensik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                  Memuat catatan audit log...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-mono text-xs">
                  Tidak ada catatan aktivitas yang sesuai dengan kriteria filter.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const { timeStr, dateStr } = formatTimestamp(log.timestamp);
                const isExpanded = expandedRowId === log.id;
                const hasPayload = Boolean(log.payload && Object.keys(log.payload).length > 0);

                return (
                  <React.Fragment key={log.id}>
                    <tr className={`hover:bg-slate-50/80 transition-colors ${
                      log.status === "BLOCKED" ? "bg-red-50/20" : ""
                    }`}>
                      {/* 1. Waktu */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        <div className="font-semibold text-slate-900">{timeStr}</div>
                        <div className="text-[10px] text-slate-400">{dateStr}</div>
                      </td>

                      {/* 2. Aktor / Pengguna */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                            {log.actorName ? log.actorName.charAt(0) : "A"}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 truncate">
                              {log.actorName || log.actorEmail}
                            </span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                              <span className="truncate max-w-[140px]">{log.actorEmail}</span>
                              {log.actorRole && (
                                <span className="px-1 py-0.2 rounded bg-slate-100 text-slate-600 uppercase text-[9px] font-semibold">
                                  {log.actorRole}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 3. Jenis Aktivitas */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200">
                          {getActionIcon(log.action, log.category)}
                          <span>{log.action}</span>
                        </span>
                      </td>

                      {/* 4. Detail Mutasi */}
                      <td className="py-3.5 px-4 max-w-sm truncate text-slate-700" title={log.details}>
                        {log.details}
                      </td>

                      {/* 5. IP & Lokasi */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <span className="text-[11px] font-semibold">{log.ip || "127.0.0.1"}</span>
                          {log.location && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-sans">
                              {log.location}
                            </span>
                          )}
                        </div>
                        {log.asn && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {log.asn}
                          </div>
                        )}
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(log.status, log.level)}
                      </td>

                      {/* 7. Aksi Forensik */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasPayload ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(log.id)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-blue-700 text-xs font-mono transition-colors inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Code className="w-3 h-3" />
                              <span>{isExpanded ? "Tutup" : "Diff JSON"}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onInspectLog(log)}
                              className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-mono transition-colors inline-flex items-center gap-1"
                            >
                              <span>Detail</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Inline Expandable Row for Diff / Payload */}
                    {isExpanded && log.payload && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={7} className="p-4">
                          <div className="rounded-xl bg-slate-900 text-slate-200 p-4 font-mono text-xs shadow-inner space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                              <div className="flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                                <span>
                                  MUTATION_ID: #{log.payload.mutationId || log.id}
                                </span>
                                {log.payload.endpoint && (
                                  <>
                                    <span>•</span>
                                    <span>TARGET: {log.payload.endpoint}</span>
                                  </>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleExpand(log.id)}
                                className="text-slate-400 hover:text-white transition-colors"
                              >
                                Tutup Preview
                              </button>
                            </div>

                            {/* Two-column diff if oldValue and newValue exist */}
                            {log.payload.oldValue && log.payload.newValue ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-slate-950/80 border border-red-950/60">
                                  <p className="text-[10px] text-red-400 uppercase tracking-wider mb-2 font-bold">
                                    - PREVIOUS STATE (old_value)
                                  </p>
                                  <pre className="text-red-200/90 text-[11px] leading-relaxed overflow-x-auto">
                                    <code>{JSON.stringify(log.payload.oldValue, null, 2)}</code>
                                  </pre>
                                </div>

                                <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-950/60">
                                  <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-2 font-bold">
                                    + COMMITTED STATE (new_value)
                                  </p>
                                  <pre className="text-emerald-200/90 text-[11px] leading-relaxed overflow-x-auto">
                                    <code>{JSON.stringify(log.payload.newValue, null, 2)}</code>
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                                <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-2 font-bold">
                                  FORENSIC AUDIT RECORD PAYLOAD
                                </p>
                                <pre className="text-slate-300 text-[11px] leading-relaxed overflow-x-auto">
                                  <code>{JSON.stringify(log.payload, null, 2)}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
