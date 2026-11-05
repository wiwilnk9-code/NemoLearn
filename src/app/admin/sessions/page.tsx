"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  Eye,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PracticeSession } from "@/types/session";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

interface SessionWithUser extends PracticeSession {
  userName: string;
  userEmail: string;
  subjectName: string;
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [scoringMethod, setScoringMethod] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Detail Modal
  const [selectedSession, setSelectedSession] = useState<SessionWithUser | null>(null);
  const [sessionDetailLoading, setSessionDetailLoading] = useState(false);
  const [sessionDetail, setSessionDetail] = useState<{
    session: PracticeSession;
    responses: Record<string, any>;
    questions: any[];
  } | null>(null);

  // Delete Confirm Modal
  const [deletingSession, setDeletingSession] = useState<SessionWithUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadSessions = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
      scoringMethod,
    });
    if (search.trim()) params.set("search", search.trim());

    fetch(`/api/admin/sessions?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSessions(data.sessions);
          setTotal(data.total);
          setStats(data.stats);
        } else {
          setFeedback({ type: "error", message: data.error || "Gagal memuat sesi latihan." });
        }
      })
      .catch((err) => {
        setFeedback({ type: "error", message: err.message || "Gagal memuat sesi latihan." });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSessions();
  }, [page, status, scoringMethod]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadSessions();
  };

  const handleOpenDetail = async (sess: SessionWithUser) => {
    setSelectedSession(sess);
    setSessionDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/sessions/${sess.id}`);
      const data = await res.json();
      if (data.success) {
        setSessionDetail(data);
      } else {
        setFeedback({ type: "error", message: data.error || "Gagal memuat detail sesi." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setSessionDetailLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deletingSession) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/sessions/${deletingSession.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: "Sesi latihan berhasil dihapus." });
        setDeletingSession(null);
        loadSessions();
      } else {
        setFeedback({ type: "error", message: data.error || "Gagal menghapus sesi." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusVariant = (s: string) => {
    switch (s) {
      case "completed":
        return "emerald";
      case "active":
        return "blue";
      default:
        return "slate";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="editorial-heading text-2xl font-bold tracking-tight text-slate-900">
            Pemantauan Sesi Latihan & Kuis Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau seluruh sesi pengerjaan soal siswa, verifikasi skor IRT dan skor persentase, serta audit riil respons jawaban.
          </p>
        </div>
      </div>

      {/* Stats Summary Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3.5">
            <span className="ui-label block text-slate-500">Total Sesi</span>
            <span className="metric-value font-mono text-xl text-slate-900 mt-1 block">
              {stats.total?.toLocaleString("id-ID") || 0}
            </span>
          </Card>
          <Card className="p-3.5">
            <span className="ui-label block text-emerald-600">Sesi Tuntas</span>
            <span className="metric-value font-mono text-xl text-emerald-700 mt-1 block">
              {stats.completed?.toLocaleString("id-ID") || 0}
            </span>
          </Card>
          <Card className="p-3.5">
            <span className="ui-label block text-brand-600">Rerata Skor</span>
            <span className="metric-value font-mono text-xl text-brand-700 mt-1 block">
              {stats.avgScoreFormatted || "-"}
            </span>
          </Card>
          <Card className="p-3.5">
            <span className="ui-label block text-blue-600">Metode IRT 3PL</span>
            <span className="metric-value font-mono text-xl text-blue-700 mt-1 block">
              {stats.irtCount?.toLocaleString("id-ID") || 0} <span className="text-xs font-normal text-slate-500">sesi</span>
            </span>
          </Card>
        </div>
      )}

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

      {/* Filter and Search Bar */}
      <Card className="p-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa, mapel, sesi ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-brand-500 transition-colors"
            />
          </form>

          {/* Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai (Completed)</option>
              <option value="active">Sedang Berlangsung (Active)</option>
              <option value="abandoned">Ditinggalkan (Abandoned)</option>
            </select>

            <select
              value={scoringMethod}
              onChange={(e) => {
                setScoringMethod(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500"
            >
              <option value="all">Semua Metode Penilaian</option>
              <option value="irt">Model IRT 3PL (200-1000)</option>
              <option value="percentage">Persentase (0-100)</option>
            </select>

            <Button
              variant="secondary"
              size="sm"
              onClick={loadSessions}
              title="Muat Ulang"
              className="p-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Sessions Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Siswa</th>
                <th className="px-4 py-3.5">Mata Pelajaran & Topik</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Skor Akhir</th>
                <th className="px-4 py-3.5">Metode Skor</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Memuat sesi latihan siswa...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Tidak ada sesi latihan yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{s.userName}</p>
                      <p className="font-mono text-[11px] text-slate-500">{s.userEmail}</p>
                    </td>

                    {/* Subject & Topic */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 capitalize block">
                        {s.subjectName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {s.config.topicId} &bull; {s.config.questionCount} soal
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={getStatusVariant(s.status) as any} size="sm" dot>
                        {s.status}
                      </Badge>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-sm text-slate-900">
                      {s.scoreFormatted ? (
                        <span>{s.scoreFormatted}</span>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">-</span>
                      )}
                    </td>

                    {/* Method */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {s.scoringMethod ? (
                        <Badge
                          variant={s.scoringMethod === "irt" ? "indigo" : "emerald"}
                          size="sm"
                          className="font-mono"
                        >
                          {s.scoringMethod === "irt" ? "IRT 3PL" : "Persentase"}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(s.startedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetail(s)}
                          title="Lihat Detail Sesi"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingSession(s)}
                          title="Hapus Sesi"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            Menampilkan {sessions.length} dari {total} total sesi
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Sebelumnya
            </Button>
            <span className="font-mono font-bold text-slate-800 px-2 text-xs">Hal {page}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= total}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </Card>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <Card className="max-w-xl w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Detail Hasil Sesi Latihan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Siswa: {selectedSession.userName} ({selectedSession.userEmail})
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setSessionDetail(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sessionDetailLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                Memuat rincian respons jawaban...
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Score Summary Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="ui-label block text-slate-500">
                      Skor Akhir Terverifikasi
                    </span>
                    <p className="text-2xl font-mono font-bold text-slate-900 mt-0.5">
                      {selectedSession.scoreFormatted || "-"}
                    </p>
                    <p className="text-[11px] text-brand-600 font-medium mt-0.5">
                      {selectedSession.scoringMethod === "irt"
                        ? "Estimasi Kemampuan IRT 3PL (Skala 200,00 - 1.000,00)"
                        : "Skor Latihan Persentase (Skala 0,00 - 100,00)"}
                    </p>
                  </div>
                  <div className="text-right text-[11px] space-y-1 font-mono">
                    <p className="text-emerald-700 font-bold">
                      Benar: {selectedSession.correctCount ?? 0} butir
                    </p>
                    <p className="text-rose-700 font-bold">
                      Salah: {selectedSession.wrongCount ?? 0} butir
                    </p>
                    <p className="text-slate-500 font-medium">
                      Kosong: {selectedSession.emptyCount ?? 0} butir
                    </p>
                  </div>
                </div>

                {/* Question Responses List */}
                {sessionDetail && (
                  <div>
                    <p className="font-bold text-slate-900 mb-2">Daftar Respons Butir Soal:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {sessionDetail.questions.map((q, idx) => {
                        const resp = sessionDetail.responses[q.id];
                        const isCorrect = resp?.isCorrect;
                        return (
                          <div
                            key={q.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                              isCorrect === true
                                ? "bg-emerald-50/50 border-emerald-200"
                                : isCorrect === false
                                ? "bg-rose-50/50 border-rose-200"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-mono font-bold text-slate-400 shrink-0">#{idx + 1}</span>
                              <p className="text-slate-800 truncate">{q.stem}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-right font-mono text-[11px]">
                              <span className="text-slate-500">
                                Dijawab: <strong className="text-slate-800">{resp?.selectedAnswer || "-"}</strong>
                              </span>
                              <span className="text-brand-600 font-bold">
                                Kunci: {q.correctAnswer}
                              </span>
                              {isCorrect === true ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : isCorrect === false ? (
                                <XCircle className="w-4 h-4 text-rose-600" />
                              ) : (
                                <span className="text-slate-400 text-[10px]">Kosong</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedSession(null);
                  setSessionDetail(null);
                }}
              >
                Tutup
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <Card className="max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Hapus Sesi Latihan?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data sesi pengerjaan oleh siswa <strong>{deletingSession.userName}</strong> ini akan dihapus dari riwayat.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeletingSession(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDeleteSession}
                disabled={isDeleting}
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Sesi"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
