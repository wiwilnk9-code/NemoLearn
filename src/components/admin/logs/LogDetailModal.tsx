"use client";

import React, { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  User,
  Globe,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { SystemLog } from "@/types/admin";

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: SystemLog | null;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!log) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(log.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-600" />
          <span>Inspeksi Detail Audit Log</span>
        </div>
      }
      description={`ID Log: ${log.id} • Waktu: ${new Date(log.timestamp).toLocaleString("id-ID")}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Top Info Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
              Aktor / Identitas
            </span>
            <div className="font-semibold text-slate-800">
              {log.actorName || log.actorEmail}
            </div>
            <div className="text-[11px] text-slate-500">
              {log.actorEmail} ({log.actorRole || "user"})
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">
              Jaringan & Origin
            </span>
            <div className="font-semibold text-slate-800">
              {log.ip || "127.0.0.1"} • {log.location || "Cluster-Jakarta"}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {log.asn || "Internal Network"}
            </div>
          </div>
        </div>

        {/* Action Details Card */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-slate-500 uppercase text-[10px] font-semibold">
              Ringkasan Aksi ({log.category?.toUpperCase() || "GENERAL"})
            </span>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {log.action}
            </span>
          </div>
          <p className="text-slate-800 leading-relaxed font-sans">
            {log.details}
          </p>
        </div>

        {/* Raw Payload Preview if available */}
        {log.payload && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-700">
                Payload JSON
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-[11px] font-mono text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId ? "ID Disalin" : "Salin Log ID"}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] max-h-60 overflow-y-auto">
              <pre>
                <code>{JSON.stringify(log.payload, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-mono font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </AdminModal>
  );
};
