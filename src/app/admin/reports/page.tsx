"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  X,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { QuestionIssueReport } from "@/types/admin";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

interface EnrichedReport extends QuestionIssueReport {
  actorName: string;
  actorEmail: string;
  targetSummary: string;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<EnrichedReport[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Resolve Modal
  const [resolvingReport, setResolvingReport] = useState<EnrichedReport | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadReports = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status: statusFilter,
    });

    fetch(`/api/admin/reports?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReports(data.reports);
          setTotal(data.total);
          setPendingCount(data.pendingCount);
        } else {
          setFeedback({ type: "error", message: data.error || "Gagal memuat laporan." });
        }
      })
      .catch((err) => {
        setFeedback({ type: "error", message: err.message || "Gagal memuat laporan." });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, [page, statusFilter]);

  // Keyboard accessibility: dismiss resolve modal on Escape key
  useEffect(() => {
    if (!resolvingReport) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) {
        setResolvingReport(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resolvingReport, submitting]);

  const handleUpdateStatus = async (reportId: string, newStatus: "pending" | "resolved", notes?: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reportId,
          status: newStatus,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: `Laporan berhasil ditandai sebagai ${newStatus === "resolved" ? "Selesai" : "Tertunda"}.`,
        });
        setResolvingReport(null);
        setResolutionNotes("");
        loadReports();
      } else {
        setFeedback({ type: "error", message: data.error || "Gagal memperbarui status laporan." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="editorial-heading text-2xl font-bold tracking-tight text-slate-900">
            Laporan Masalah Soal dari Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar laporan indikasi kunci salah, rumus terpotong, atau pembahasan kurang tepat yang dikirimkan oleh siswa saat latihan.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="amber" size="sm" dot>
            {pendingCount} Tertunda
          </Badge>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <Card className="p-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500"
            >
              <option value="all">Semua Laporan</option>
              <option value="pending">Tertunda (Perlu Tindak Lanjut)</option>
              <option value="resolved">Selesai Ditindaklanjuti</option>
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadReports}
            title="Muat Ulang"
            className="p-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </Card>

      {/* Reports List */}
      <div className="space-y-3">
        {loading && reports.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
            Memuat daftar laporan masalah...
          </Card>
        ) : reports.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-500">
            Tidak ada laporan yang perlu ditindaklanjuti saat ini.
          </Card>
        ) : (
          reports.map((r) => {
            const isPending = r.status === "pending" || !r.status;
            return (
              <Card
                key={r.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-200 transition-colors"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isPending ? "amber" : "emerald"} size="sm" dot>
                      {isPending ? "Tertunda" : "Selesai"}
                    </Badge>
                    <span className="text-xs font-bold text-slate-900">{r.targetSummary}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="ui-label block text-slate-500 text-[10px]">
                        Catatan Masalah dari {r.actorName} ({r.actorEmail}):
                      </p>
                      <p className="mt-1 leading-relaxed text-slate-800 font-medium">{r.reason}</p>
                    </div>
                  </div>

                  {r.notes && (
                    <p className="text-[11px] text-emerald-700 font-medium pl-1">
                      &bull; Catatan Tindak Lanjut Admin: {r.notes}{" "}
                      {r.resolvedBy && `(oleh ${r.resolvedBy})`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Link href="/admin/questions">
                    <Button variant="secondary" size="sm" className="inline-flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Cek di Bank Soal</span>
                    </Button>
                  </Link>

                  {isPending ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setResolvingReport(r);
                        setResolutionNotes("");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tandai Selesai</span>
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus(r.id, "pending")}
                    >
                      Buka Kembali
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Resolve Modal */}
      {resolvingReport && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !submitting && setResolvingReport(null)}
        >
          <Card
            className="max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tindak Lanjuti Laporan Masalah
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan catatan tindakan (misal: "Kunci jawaban diperbarui ke opsi C dan pembahasan dilengkapi").
              </p>
            </div>

            <textarea
              rows={3}
              placeholder="Tuliskan catatan tindak lanjut..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:border-brand-500 transition-colors"
            />

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setResolvingReport(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleUpdateStatus(resolvingReport.id, "resolved", resolutionNotes)}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? "Menyimpan..." : "Simpan & Tandai Selesai"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
