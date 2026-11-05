"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  FileEdit,
  Trash2,
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  FileUp,
  Check,
} from "lucide-react";
import { Question } from "@/types/question";
import { MathRenderer } from "@/components/MathRenderer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Preview Modal
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Delete Confirm Modal
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification feedback
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadQuestions = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      subjectId: subject,
      difficulty,
      status,
      includeDrafts: "true",
    });
    if (search.trim()) params.set("search", search.trim());

    fetch(`/api/questions?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setQuestions(data.questions);
          setTotal(data.total);
          setStats(data.stats);
        } else {
          setFeedback({ type: "error", message: data.error || "Gagal memuat bank soal." });
        }
      })
      .catch((err) => {
        setFeedback({ type: "error", message: err.message || "Gagal memuat bank soal." });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadQuestions();
  }, [page, subject, difficulty, status]);

  // Keyboard accessibility: dismiss active modal on Escape key
  useEffect(() => {
    if (!previewQuestion && !deletingQuestion) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!isDeleting) {
          setPreviewQuestion(null);
          setDeletingQuestion(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewQuestion, deletingQuestion, isDeleting]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadQuestions();
  };

  const handleToggleStatus = async (q: Question) => {
    const newStatus = q.status === "draft" ? "published" : "draft";
    try {
      const res = await fetch(`/api/questions/${q.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          message: `Status butir soal diubah menjadi ${newStatus === "published" ? "Publik" : "Draft"}.`,
        });
        loadQuestions();
      } else {
        setFeedback({ type: "error", message: data.error || "Gagal mengubah status butir soal." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleDelete = async () => {
    if (!deletingQuestion) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/questions/${deletingQuestion.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", message: "Butir soal berhasil dihapus dari bank soal." });
        setDeletingQuestion(null);
        loadQuestions();
      } else {
        setFeedback({ type: "error", message: data.error || "Gagal menghapus butir soal." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const getDifficultyVariant = (diff: string) => {
    switch (diff) {
      case "hots":
        return "rose";
      case "sulit":
        return "amber";
      case "sedang":
        return "blue";
      default:
        return "emerald";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="editorial-heading text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Bank Soal & Konten Kurikulum
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit butir soal kurikulum SMA, validasi rendering formula KaTeX, status publikasi, dan kontribusi pendidik.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link href="/bank-soal">
            <Button variant="secondary" size="sm">
              Tampilan Guru
            </Button>
          </Link>
          <Link href="/bank-soal?tab=create">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Butir Baru
            </Button>
          </Link>
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

      {/* Filter and Search Bar */}
      <Card className="p-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari teks soal, rumus, materi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-brand-500 transition-colors"
            />
          </form>

          {/* Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500"
            >
              <option value="all">Semua Mapel</option>
              <option value="fisika">Fisika</option>
              <option value="matematika">Matematika</option>
              <option value="kimia">Kimia</option>
              <option value="biologi">Biologi</option>
            </select>

            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500"
            >
              <option value="all">Semua Tingkat</option>
              <option value="mudah">Mudah</option>
              <option value="sedang">Sedang</option>
              <option value="sulit">Sulit</option>
              <option value="hots">HOTS</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500"
            >
              <option value="all">Semua Status</option>
              <option value="published">Publik (Aktif)</option>
              <option value="draft">Draft</option>
            </select>

            <Button
              variant="secondary"
              size="sm"
              onClick={loadQuestions}
              title="Muat Ulang"
              className="p-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Questions Table (Desktop) & Cards (Mobile) */}
      <Card className="overflow-hidden">
        {/* Mobile View (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading && questions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
              Memuat butir soal...
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Tidak ada butir soal yang sesuai dengan kriteria filter.
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-xs text-slate-900 capitalize">
                      {q.subjectId}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1.5 font-mono">&bull; {q.topicId}</span>
                  </div>
                  <Badge variant={getDifficultyVariant(q.difficulty) as any} size="sm">
                    {q.difficulty}
                  </Badge>
                </div>

                <div className="text-xs text-slate-800 max-h-24 overflow-hidden font-medium leading-relaxed break-words">
                  <MathRenderer text={q.stem} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-600">Kunci: {q.correctAnswer}</span>
                    <button onClick={() => handleToggleStatus(q)}>
                      <Badge
                        variant={q.status === "published" ? "emerald" : "amber"}
                        size="sm"
                        dot
                      >
                        {q.status === "published" ? "Publik" : "Draft"}
                      </Badge>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewQuestion(q)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                      title="Pratinjau"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingQuestion(q)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop / Tablet View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Mata Pelajaran & Materi</th>
                <th className="px-4 py-3.5">Pertanyaan (Stem)</th>
                <th className="px-4 py-3.5">Tingkat</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Kunci</th>
                <th className="px-4 py-3.5">Dibuat Oleh</th>
                <th className="px-5 py-3.5 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && questions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
                    Memuat butir soal...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Tidak ada butir soal yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Subject & Topic */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 capitalize block">
                        {q.subjectId}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">{q.topicId}</span>
                    </td>

                    {/* Stem preview */}
                    <td className="px-4 py-3.5 max-w-xs sm:max-w-md min-w-[220px]">
                      <div className="max-h-20 overflow-hidden text-slate-800 font-medium leading-relaxed break-words">
                        <MathRenderer text={q.stem} />
                      </div>
                    </td>

                    {/* Difficulty */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge variant={getDifficultyVariant(q.difficulty) as any} size="sm">
                        {q.difficulty}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(q)}
                        title="Klik untuk beralih Draft / Published"
                      >
                        <Badge
                          variant={q.status === "published" ? "emerald" : "amber"}
                          size="sm"
                          dot
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {q.status === "published" ? "Publik" : "Draft"}
                        </Badge>
                      </button>
                    </td>

                    {/* Correct Key */}
                    <td className="px-4 py-3.5 font-mono font-bold text-xs text-brand-600">
                      {q.correctAnswer}
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                      {q.createdByName || (q.sourceType === "curated_bank" ? "Kurikulum SMA" : "Guru")}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewQuestion(q)}
                          title="Lihat Pratinjau Lengkap"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingQuestion(q)}
                          title="Hapus Butir Soal"
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
            Menampilkan {questions.length} dari {total} butir soal
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

      {/* Preview Modal */}
      {previewQuestion && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewQuestion(null)}
        >
          <Card
            className="max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 uppercase">
                  {previewQuestion.subjectId} &bull; {previewQuestion.topicId}
                </span>
                <Badge variant={getDifficultyVariant(previewQuestion.difficulty) as any} size="sm">
                  {previewQuestion.difficulty}
                </Badge>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stem */}
            <ErrorBoundary fallbackTitle="Gagal memuat pratinjau teks soal">
              <div>
                <p className="ui-label block text-slate-500 mb-1">Pertanyaan (Stem):</p>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm leading-relaxed text-slate-900">
                  <MathRenderer text={previewQuestion.stem} />
                </div>
              </div>
            </ErrorBoundary>

            {/* Options */}
            <div>
              <p className="ui-label block text-slate-500 mb-1.5">Pilihan Jawaban:</p>
              <div className="space-y-2">
                {previewQuestion.options.map((opt) => {
                  const isCorrect = opt.key === previewQuestion.correctAnswer;
                  return (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                        isCorrect
                          ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold shrink-0 text-xs ${
                          isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <div className="flex-1">
                        <MathRenderer text={opt.text} />
                      </div>
                      {isCorrect && (
                        <Badge variant="emerald" size="sm" className="font-mono">
                          Kunci Jawaban
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hint if present */}
            {previewQuestion.hint && (
              <div>
                <p className="ui-label block text-amber-700 mb-1">
                  Petunjuk Pengerjaan:
                </p>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <MathRenderer text={previewQuestion.hint} />
                </div>
              </div>
            )}

            {/* Explanation */}
            <div>
              <p className="ui-label block text-slate-500 mb-1">Pembahasan Konsep:</p>
              <div className="p-4 rounded-xl bg-brand-50/40 border border-brand-100 text-xs leading-relaxed text-slate-900">
                <MathRenderer text={previewQuestion.explanation} />
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewQuestion(null)}
              >
                Tutup
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuestion && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isDeleting && setDeletingQuestion(null)}
        >
          <Card
            className="max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Hapus Butir Soal?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Butir soal ini akan dihapus secara permanen dari basis data kurikulum platform. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeletingQuestion(null)}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Soal"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
