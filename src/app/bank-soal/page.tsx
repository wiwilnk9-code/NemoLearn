"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "@/types/user";
import { Subject, Topic } from "@/types/subject";
import {
  Question,
  QuestionDifficulty,
  QuestionGrade,
  QuestionOption,
  QuestionStatus,
  QuestionStats,
} from "@/types/question";
import { MathRenderer } from "@/components/MathRenderer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Layers,
  Sparkles,
  Search,
  Filter,
  Plus,
  Upload,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  BookOpen,
  User as UserIcon,
  Calendar,
  Lightbulb,
  Image as ImageIcon,
  Check,
  RotateCcw,
  FileText,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

function BankSoalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // User & Subjects state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Questions & Stats state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<QuestionStats>({
    totalPublished: 0,
    totalDraft: 0,
    totalHots: 0,
    myQuestionsCount: 0,
  });

  // Filters state
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [filterMineOnly, setFilterMineOnly] = useState(false);

  // Modals state
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Notification state
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formTopicId, setFormTopicId] = useState("");
  const [formSubtopic, setFormSubtopic] = useState("");
  const [formGrade, setFormGrade] = useState<QuestionGrade>("SMA");
  const [formDifficulty, setFormDifficulty] = useState<QuestionDifficulty>("sedang");
  const [formStem, setFormStem] = useState("");
  const [formOptionA, setFormOptionA] = useState("");
  const [formOptionB, setFormOptionB] = useState("");
  const [formOptionC, setFormOptionC] = useState("");
  const [formOptionD, setFormOptionD] = useState("");
  const [formOptionE, setFormOptionE] = useState("");
  const [formCorrectAnswer, setFormCorrectAnswer] = useState<"A" | "B" | "C" | "D" | "E">("A");
  const [formExplanation, setFormExplanation] = useState("");
  const [formHint, setFormHint] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formStatus, setFormStatus] = useState<QuestionStatus>("published");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewFormula, setPreviewFormula] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Import JSON State
  const [importJsonText, setImportJsonText] = useState("");
  const [importDefaultStatus, setImportDefaultStatus] = useState<QuestionStatus>("published");
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "owner";
  const isTeacher = currentUser?.role === "guru";
  const canCreate = isTeacher || isAdmin;

  // Load User & Subjects once
  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/subjects").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([userData, subjectData]) => {
        if (userData?.user) setCurrentUser(userData.user);
        if (subjectData?.subjects) setSubjects(subjectData.subjects);
      })
      .catch((err) => console.error("Gagal inisialisasi:", err))
      .finally(() => setLoading(false));
  }, []);

  // Handle URL query action (e.g. ?tab=create from Admin Dashboard)
  useEffect(() => {
    const tab = searchParams.get("tab");
    const action = searchParams.get("action");
    if (tab === "create" || action === "create") {
      setIsFormModalOpen(true);
    }
  }, [searchParams]);

  // Fetch Questions when filters or page change
  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSubject !== "all") params.set("subjectId", selectedSubject);
      if (selectedTopic !== "all") params.set("topicId", selectedTopic);
      if (selectedGrade !== "all") params.set("grade", selectedGrade);
      if (selectedDifficulty !== "all") params.set("difficulty", selectedDifficulty);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (searchKeyword.trim()) params.set("search", searchKeyword.trim());
      if (filterMineOnly) params.set("mineOnly", "true");
      params.set("page", String(page));
      params.set("limit", "10");

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setTotalQuestions(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Gagal memuat pertanyaan:", err);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [
    page,
    selectedSubject,
    selectedTopic,
    selectedGrade,
    selectedDifficulty,
    selectedStatus,
    filterMineOnly,
    currentUser,
  ]);

  // Handle Search on Enter or Click
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions();
  };

  // Topics for selected filter subject
  const currentFilterSubject = subjects.find((s) => s.id === selectedSubject);

  // Topics for form subject
  const currentFormSubject = subjects.find((s) => s.id === formSubjectId);

  // Feedback Notification helper
  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Open Create Form
  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    const initialSub = subjects[0]?.id || "fisika";
    const subObj = subjects.find((s) => s.id === initialSub);
    setFormSubjectId(initialSub);
    setFormTopicId(subObj?.topics[0]?.id || "dinamika");
    setFormSubtopic("");
    setFormGrade("11");
    setFormDifficulty("sedang");
    setFormStem("");
    setFormOptionA("");
    setFormOptionB("");
    setFormOptionC("");
    setFormOptionD("");
    setFormOptionE("");
    setFormCorrectAnswer("A");
    setFormExplanation("");
    setFormHint("");
    setFormImageUrl("");
    setFormStatus("published");
    setFormError(null);
    setPreviewFormula(false);
    setIsFormDirty(false);
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEditModal = (q: Question) => {
    setEditingQuestion(q);
    setFormSubjectId(q.subjectId);
    setFormTopicId(q.topicId);
    setFormSubtopic(q.subtopic || "");
    setFormGrade(q.grade || "SMA");
    setFormDifficulty(q.difficulty);
    setFormStem(q.stem);
    setFormOptionA(q.options.find((o) => o.key === "A")?.text || "");
    setFormOptionB(q.options.find((o) => o.key === "B")?.text || "");
    setFormOptionC(q.options.find((o) => o.key === "C")?.text || "");
    setFormOptionD(q.options.find((o) => o.key === "D")?.text || "");
    setFormOptionE(q.options.find((o) => o.key === "E")?.text || "");
    setFormCorrectAnswer(q.correctAnswer);
    setFormExplanation(q.explanation);
    setFormHint(q.hint || "");
    setFormImageUrl(q.imageUrl || "");
    setFormStatus(q.status || "published");
    setFormError(null);
    setPreviewFormula(false);
    setIsFormDirty(false);
    setIsFormModalOpen(true);
  };

  // Close Form Modal with Unsaved Changes Guard
  const handleCloseFormModal = () => {
    if (isFormDirty) {
      const confirmLeave = window.confirm("Ada perubahan form yang belum disimpan. Yakin ingin menutup?");
      if (!confirmLeave) return;
    }
    setIsFormModalOpen(false);
    setEditingQuestion(null);
    setIsFormDirty(false);
  };

  // Submit Form (Create or Edit)
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend validations
    if (!formStem.trim() || formStem.trim().length < 5) {
      setFormError("Teks soal wajib diisi dan minimal 5 karakter.");
      return;
    }
    if (!formOptionA.trim() || !formOptionB.trim() || !formOptionC.trim() || !formOptionD.trim() || !formOptionE.trim()) {
      setFormError("Seluruh 5 opsi jawaban (A, B, C, D, E) wajib diisi.");
      return;
    }
    if (!formExplanation.trim() || formExplanation.trim().length < 5) {
      setFormError("Pembahasan soal wajib diisi minimal 5 karakter.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      subjectId: formSubjectId,
      topicId: formTopicId,
      subtopic: formSubtopic.trim() || undefined,
      grade: formGrade,
      difficulty: formDifficulty,
      stem: formStem.trim(),
      options: [
        { key: "A", text: formOptionA.trim() },
        { key: "B", text: formOptionB.trim() },
        { key: "C", text: formOptionC.trim() },
        { key: "D", text: formOptionD.trim() },
        { key: "E", text: formOptionE.trim() },
      ],
      correctAnswer: formCorrectAnswer,
      explanation: formExplanation.trim(),
      hint: formHint.trim() || undefined,
      imageUrl: formImageUrl.trim() || undefined,
      status: formStatus,
    };

    try {
      const url = editingQuestion ? `/api/questions/${editingQuestion.id}` : "/api/questions";
      const method = editingQuestion ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan soal.");
      }

      showFeedback(
        "success",
        editingQuestion
          ? "Soal berhasil diperbarui!"
          : formStatus === "draft"
          ? "Soal berhasil disimpan sebagai draft."
          : "Soal berhasil dipublikasikan ke Bank Soal!"
      );

      setIsFormDirty(false);
      setIsFormModalOpen(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan soal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm and Execute Delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/questions/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus soal.");
      }

      showFeedback("success", "Soal berhasil dihapus dari Bank Soal.");
      setDeleteTarget(null);
      fetchQuestions();
    } catch (err: any) {
      showFeedback("error", err.message || "Gagal menghapus soal.");
    }
  };

  // Handle Import JSON
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);

    let parsed: any;
    try {
      parsed = JSON.parse(importJsonText);
    } catch (err) {
      setImportError("Format JSON tidak valid. Pastikan sintaks kurung siku dan petik dua benar.");
      return;
    }

    if (!Array.isArray(parsed) && !Array.isArray(parsed?.questions)) {
      setImportError("JSON harus berupa array butir soal atau objek { questions: [...] }.");
      return;
    }

    const questionList = Array.isArray(parsed) ? parsed : parsed.questions;

    setIsImporting(true);
    try {
      const res = await fetch("/api/questions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: questionList,
          defaultStatus: importDefaultStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const details = data.details ? `:\n${data.details.join("\n")}` : "";
        throw new Error((data.error || "Gagal mengimpor soal.") + details);
      }

      showFeedback("success", data.message || "Soal berhasil diimpor.");
      setIsImportModalOpen(false);
      setImportJsonText("");
      fetchQuestions();
    } catch (err: any) {
      setImportError(err.message || "Terjadi kesalahan saat mengimpor soal.");
    } finally {
      setIsImporting(false);
    }
  };

  // Load sample template for JSON Import
  const handleLoadSampleJson = () => {
    const sample = [
      {
        subjectId: "fisika",
        topicId: "dinamika",
        subtopic: "Hukum II Newton",
        grade: "11",
        difficulty: "sedang",
        stem: "Sebuah balok bermassa $m = 2\\text{ kg}$ ditarik dengan gaya $F = 10\\text{ N}$ pada bidang datar licin. Berapakah percepatan balok?",
        options: {
          A: "$2\\text{ m/s}^2$",
          B: "$5\\text{ m/s}^2$",
          C: "$8\\text{ m/s}^2$",
          D: "$10\\text{ m/s}^2$",
          E: "$20\\text{ m/s}^2$",
        },
        correctAnswer: "B",
        explanation: "Gunakan Hukum II Newton: $\\Sigma F = ma \\implies a = F/m = 10/2 = 5\\text{ m/s}^2$. Jawaban: B.",
        hint: "Gunakan rumus $a = F/m$.",
      },
    ];
    setImportJsonText(JSON.stringify(sample, null, 2));
    setImportError(null);
  };

  // Permission checker for a specific question
  const canManageQuestion = (q: Question) => {
    if (isAdmin) return true;
    if (isTeacher && q.createdBy === currentUser?.id) return true;
    return false;
  };

  const getDifficultyBadge = (d: QuestionDifficulty) => {
    switch (d) {
      case "hots":
        return { variant: "rose" as const, bg: "bg-rose-50 text-rose-700 border-rose-200", icon: Flame, text: "HOTS" };
      case "sulit":
        return { variant: "amber" as const, bg: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle, text: "Sulit" };
      case "sedang":
        return { variant: "blue" as const, bg: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2, text: "Sedang" };
      default:
        return { variant: "emerald" as const, bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, text: "Mudah" };
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Toast Notification Banner */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 p-4 rounded-xl shadow-lg border max-w-md animate-fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <p className="text-xs font-medium leading-relaxed">{feedback.message}</p>
          <button onClick={() => setFeedback(null)} className="ml-auto text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Badge variant="indigo" size="sm" className="mb-2">
            <Layers className="w-3 h-3 mr-1" />
            Bank Soal Kurikulum Merdeka
          </Badge>
          <h1 className="editorial-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Bank Soal & Pengelolaan Soal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar butir soal SMA terstandar yang digunakan dalam latihan mandiri dan sebagai cadangan terverifikasi ketika AI offline.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canCreate && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Upload className="w-4 h-4 mr-1.5 text-blue-600" />
                Impor JSON
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleOpenCreateModal}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Soal Baru
              </Button>
            </>
          )}

          <Link href="/generator">
            <Button variant="secondary" size="sm">
              <Sparkles className="w-4 h-4 mr-1.5 text-brand-600" />
              Latihan Mandiri
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <span className="ui-label block text-emerald-600">Soal Publikasi</span>
          <span className="metric-value font-mono text-xl text-slate-900 mt-1 block">
            {stats.totalPublished}
          </span>
        </Card>

        <Card
          onClick={() => {
            if (canCreate) {
              setSelectedStatus(selectedStatus === "draft" ? "all" : "draft");
              setPage(1);
            }
          }}
          className={`p-3.5 ${
            canCreate ? "cursor-pointer hover:border-brand-400 transition-colors" : ""
          }`}
        >
          <span className="ui-label block text-amber-600">Draft Soal</span>
          <span className="metric-value font-mono text-xl text-slate-900 mt-1 block">
            {stats.totalDraft}
          </span>
        </Card>

        <Card
          onClick={() => {
            setSelectedDifficulty(selectedDifficulty === "hots" ? "all" : "hots");
            setPage(1);
          }}
          className="p-3.5 cursor-pointer hover:border-rose-300 transition-colors"
        >
          <span className="ui-label block text-rose-600">Soal HOTS</span>
          <span className="metric-value font-mono text-xl text-slate-900 mt-1 block">
            {stats.totalHots}
          </span>
        </Card>

        <Card
          onClick={() => {
            if (canCreate) {
              setFilterMineOnly(!filterMineOnly);
              setPage(1);
            }
          }}
          className={`p-3.5 ${
            canCreate ? "cursor-pointer hover:border-blue-400 transition-colors" : ""
          } ${filterMineOnly ? "border-2 border-blue-500" : ""}`}
        >
          <span className="ui-label block text-blue-600">Buatan Saya</span>
          <span className="metric-value font-mono text-xl text-slate-900 mt-1 block">
            {canCreate ? stats.myQuestionsCount : "-"}
          </span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-3.5 space-y-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Cari kata kunci pertanyaan, rumus, materi, atau nama pembuat..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-brand-500 bg-slate-50 transition-colors"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Cari
          </Button>
        </form>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 pt-1 text-xs">
          {/* Subject */}
          <div>
            <label className="ui-label block text-slate-500 mb-1">Mata Pelajaran</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic("all");
                setPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500"
            >
              <option value="all">Semua Mapel</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div>
            <label className="ui-label block text-slate-500 mb-1">Materi Pokok</label>
            <select
              value={selectedTopic}
              disabled={selectedSubject === "all" || !currentFilterSubject}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500 disabled:opacity-50"
            >
              <option value="all">Semua Materi</option>
              {currentFilterSubject?.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Grade */}
          <div>
            <label className="ui-label block text-slate-500 mb-1">Jenjang Kelas</label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500"
            >
              <option value="all">Semua Kelas</option>
              <option value="10">Kelas 10 SMA</option>
              <option value="11">Kelas 11 SMA</option>
              <option value="12">Kelas 12 SMA</option>
              <option value="SMA">Umum SMA</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="ui-label block text-slate-500 mb-1">Tingkat Kesulitan</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => {
                setSelectedDifficulty(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500"
            >
              <option value="all">Semua Tingkat</option>
              <option value="mudah">Mudah</option>
              <option value="sedang">Sedang</option>
              <option value="sulit">Sulit</option>
              <option value="hots">HOTS</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="ui-label block text-slate-500 mb-1">Status Soal</label>
            <select
              value={selectedStatus}
              disabled={!canCreate}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-hidden focus:border-brand-500 disabled:opacity-50"
            >
              <option value="all">Semua Status</option>
              <option value="published">Publikasi</option>
              {canCreate && <option value="draft">Draft Saya</option>}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedSubject("all");
                setSelectedTopic("all");
                setSelectedGrade("all");
                setSelectedDifficulty("all");
                setSelectedStatus("all");
                setSearchKeyword("");
                setFilterMineOnly(false);
                setPage(1);
              }}
              className="w-full"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Question List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
          <span className="font-mono">Menampilkan {questions.length} dari {totalQuestions} butir soal</span>
          {filterMineOnly && (
            <Badge variant="blue" size="sm">
              <Check className="w-3 h-3 mr-1" />
              Filter: Butir Buatan Saya
            </Badge>
          )}
        </div>

        {questions.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Tidak Ada Soal yang Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Kriteria filter atau pencarian tidak cocok dengan butir soal manapun. Coba atur ulang filter atau tambahkan butir baru.
            </p>
            {canCreate && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleOpenCreateModal}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Buat Soal Sekarang
              </Button>
            )}
          </Card>
        ) : (
          questions.map((q) => {
            const diff = getDifficultyBadge(q.difficulty);
            const DiffIcon = diff.icon;
            const canManage = canManageQuestion(q);
            const isDraft = q.status === "draft";

            return (
              <ErrorBoundary key={q.id} fallbackTitle="Gagal memuat butir soal">
                <Card className="p-5 hover:border-slate-300 transition-colors space-y-3.5">
                  {/* Meta Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Status Badge */}
                      <Badge variant={isDraft ? "amber" : "emerald"} size="sm" dot>
                        {isDraft ? "Draft" : "Publikasi"}
                      </Badge>

                      {/* Subject */}
                      <Badge variant="indigo" size="sm" className="capitalize">
                        {q.subjectId}
                      </Badge>

                      {/* Grade */}
                      <Badge variant="slate" size="sm">
                        Kelas {q.grade || "SMA"}
                      </Badge>

                      {/* Difficulty */}
                      <Badge variant={diff.variant} size="sm">
                        <DiffIcon className="w-3 h-3 mr-1" />
                        {diff.text}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                      {q.createdByName && (
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <UserIcon className="w-3 h-3 text-brand-600" />
                          {q.createdByName}
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(q.createdAt).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>

                  {/* Question Stem with KaTeX LaTeX */}
                  <div className="text-sm font-medium text-slate-900 leading-relaxed">
                    <MathRenderer text={q.stem} />
                  </div>

                  {/* Subtopic & Hint Snippet if present */}
                  {(q.subtopic || q.hint) && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      {q.subtopic && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          Materi: <strong className="text-slate-700">{q.subtopic}</strong>
                        </span>
                      )}
                      {q.hint && (
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          Tersedia petunjuk
                        </span>
                      )}
                    </div>
                  )}

                  {/* Options preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
                    {q.options.map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-2 rounded-xl border flex items-start gap-2 ${
                          opt.key === q.correctAnswer
                            ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium"
                            : "bg-slate-50/60 border-slate-200 text-slate-700"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5 ${
                            opt.key === q.correctAnswer
                              ? "bg-emerald-600 text-white"
                              : "bg-white text-slate-600 border border-slate-200"
                          }`}
                        >
                          {opt.key}
                        </span>
                        <div className="min-w-0 flex-1 break-words">
                          <MathRenderer text={opt.text} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {q.id}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setViewQuestion(q)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Lihat Rincian
                      </Button>

                      {canManage && (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEditModal(q)}
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1 text-brand-600" />
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(q)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Hapus
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </ErrorBoundary>
            );
          })
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 text-xs text-slate-500 border-t border-slate-200">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Sebelumnya
            </Button>

            <span className="font-mono text-[11px]">
              Halaman <strong className="text-slate-800">{page}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
            </span>

            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Selanjutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: LIHAT RINCIAN SOAL (VIEW DETAIL)                                 */}
      {/* ========================================================================= */}
      {viewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="indigo" size="sm" className="capitalize">
                    {viewQuestion.subjectId}
                  </Badge>
                  <Badge variant="slate" size="sm">
                    Kelas {viewQuestion.grade || "SMA"}
                  </Badge>
                  <Badge
                    variant={viewQuestion.status === "draft" ? "amber" : "emerald"}
                    size="sm"
                    dot
                  >
                    {viewQuestion.status === "draft" ? "Draft" : "Publikasi"}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-900">Rincian Butir Soal Bank Soal</h3>
              </div>

              <button
                type="button"
                onClick={() => setViewQuestion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stem */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="ui-label block text-slate-500">Pertanyaan:</span>
              <div className="text-sm font-medium text-slate-900 leading-relaxed">
                <MathRenderer text={viewQuestion.stem} />
              </div>
            </div>

            {/* Image if provided */}
            {viewQuestion.imageUrl && (
              <div className="p-3 rounded-xl border border-slate-200 bg-white text-center">
                <img
                  src={viewQuestion.imageUrl}
                  alt="Ilustrasi Soal"
                  className="max-h-48 mx-auto object-contain rounded-lg"
                />
              </div>
            )}

            {/* Options */}
            <div className="space-y-2">
              <span className="ui-label block text-slate-500">Pilihan Jawaban:</span>
              <div className="space-y-2">
                {viewQuestion.options.map((opt) => {
                  const isCorrect = opt.key === viewQuestion.correctAnswer;
                  return (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                        isCorrect
                          ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                          isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <div className="text-xs flex-1">
                        <MathRenderer text={opt.text} />
                      </div>
                      {isCorrect && (
                        <Badge variant="emerald" size="sm" className="font-mono">
                          Kunci Benar
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            <div className="p-4 rounded-xl bg-brand-50/40 border border-brand-100 space-y-1.5">
              <span className="ui-label text-brand-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Pembahasan Konseptual Langkah-Demi-Langkah:
              </span>
              <div className="text-xs font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                <MathRenderer text={viewQuestion.explanation} />
              </div>
            </div>

            {/* Hint if present */}
            {viewQuestion.hint && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-bold">Petunjuk Pengerjaan:</span>{" "}
                  <MathRenderer text={viewQuestion.hint} />
                </div>
              </div>
            )}

            {/* Footer Metadata & Start Practice link */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-[11px] text-slate-500 font-mono">
                Penulis: <strong className="text-slate-800">{viewQuestion.createdByName || "Kurikulum Merdeka"}</strong>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setViewQuestion(null);
                    router.push(`/generator?subjectId=${viewQuestion.subjectId}&topicId=${viewQuestion.topicId}`);
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Latih Materi Ini
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewQuestion(null)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: FORM TAMBAH / EDIT SOAL (CREATE / EDIT)                          */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <Card className="max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-xl border-slate-200 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="ui-label block text-brand-600 mb-0.5">
                  {editingQuestion ? "Mode Perubahan" : "Form Tambah Baru"}
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingQuestion ? "Edit Butir Soal Bank Soal" : "Tambah Soal ke Bank Soal"}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseFormModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              {/* Row 1: Mapel & Materi Pokok */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="ui-label block text-slate-700 mb-1">
                    Mata Pelajaran (SMA) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formSubjectId}
                    onChange={(e) => {
                      setFormSubjectId(e.target.value);
                      const subObj = subjects.find((s) => s.id === e.target.value);
                      if (subObj && subObj.topics.length > 0) {
                        setFormTopicId(subObj.topics[0].id);
                      }
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="ui-label block text-slate-700 mb-1">
                    Materi Pokok <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formTopicId}
                    onChange={(e) => {
                      setFormTopicId(e.target.value);
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  >
                    {currentFormSubject?.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Submateri, Kelas, Kesulitan, Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="ui-label block text-slate-700 mb-1">Submateri / Topik Khusus</label>
                  <input
                    type="text"
                    value={formSubtopic}
                    onChange={(e) => {
                      setFormSubtopic(e.target.value);
                      setIsFormDirty(true);
                    }}
                    placeholder="Contoh: Hukum II Newton"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="ui-label block text-slate-700 mb-1">Jenjang Kelas</label>
                  <select
                    value={formGrade}
                    onChange={(e) => {
                      setFormGrade(e.target.value as QuestionGrade);
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  >
                    <option value="10">Kelas 10 SMA</option>
                    <option value="11">Kelas 11 SMA</option>
                    <option value="12">Kelas 12 SMA</option>
                    <option value="SMA">Umum SMA</option>
                  </select>
                </div>

                <div>
                  <label className="ui-label block text-slate-700 mb-1">Tingkat Kesulitan</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => {
                      setFormDifficulty(e.target.value as QuestionDifficulty);
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  >
                    <option value="mudah">Mudah</option>
                    <option value="sedang">Sedang</option>
                    <option value="sulit">Sulit</option>
                    <option value="hots">HOTS</option>
                  </select>
                </div>

                <div>
                  <label className="ui-label block text-slate-700 mb-1">Status Soal</label>
                  <select
                    value={formStatus}
                    onChange={(e) => {
                      setFormStatus(e.target.value as QuestionStatus);
                      setIsFormDirty(true);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  >
                    <option value="published">Publikasikan Langsung</option>
                    <option value="draft">Simpan sebagai Draft</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Pertanyaan / Stem with KaTeX live preview toggle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="ui-label text-slate-700">
                    Teks Pertanyaan (Stem) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewFormula(!previewFormula)}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    {previewFormula ? "Tutup Pratinjau LaTeX" : "Lihat Pratinjau LaTeX ($rumus$)"}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={formStem}
                  onChange={(e) => {
                    setFormStem(e.target.value);
                    setIsFormDirty(true);
                  }}
                  placeholder="Ketik teks soal di sini. Gunakan $rumus$ untuk inline math atau $$rumus$$ untuk block math..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden leading-relaxed transition-colors"
                />

                {previewFormula && formStem && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-brand-200 space-y-1">
                    <span className="ui-label block text-brand-600">Pratinjau KaTeX:</span>
                    <div className="text-xs font-medium text-slate-900">
                      <MathRenderer text={formStem} />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 4: URL Gambar & Petunjuk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="ui-label block text-slate-700 mb-1">
                    URL Gambar / Diagram Pendukung (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => {
                      setFormImageUrl(e.target.value);
                      setIsFormDirty(true);
                    }}
                    placeholder="https://example.com/diagram.png"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="ui-label block text-slate-700 mb-1">
                    Petunjuk Pengerjaan / Hint (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formHint}
                    onChange={(e) => {
                      setFormHint(e.target.value);
                      setIsFormDirty(true);
                    }}
                    placeholder="Petunjuk singkat atau rumus kunci (tanpa membocorkan kunci)..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden"
                  />
                  {previewFormula && formHint && (
                    <div className="mt-1.5 p-2 rounded-lg bg-slate-50 border border-brand-200 text-xs">
                      <span className="ui-label block text-brand-600 mb-0.5">Pratinjau Petunjuk:</span>
                      <MathRenderer text={formHint} />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 5: 5 Pilihan Jawaban A, B, C, D, E */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="ui-label text-slate-700">
                    Pilihan Jawaban (A - E) & Tentukan Kunci Jawaban Benar <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Pilih tombol radio pada opsi yang merupakan jawaban benar
                  </span>
                </div>

                <div className="space-y-2">
                  {[
                    { key: "A", val: formOptionA, setVal: setFormOptionA },
                    { key: "B", val: formOptionB, setVal: setFormOptionB },
                    { key: "C", val: formOptionC, setVal: setFormOptionC },
                    { key: "D", val: formOptionD, setVal: setFormOptionD },
                    { key: "E", val: formOptionE, setVal: setFormOptionE },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                        formCorrectAnswer === item.key ? "bg-emerald-50/70 border-emerald-300" : "bg-white border-slate-200"
                      }`}
                    >
                      <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1">
                        <input
                          type="radio"
                          name="correctAnswerRadio"
                          checked={formCorrectAnswer === item.key}
                          onChange={() => {
                            setFormCorrectAnswer(item.key as any);
                            setIsFormDirty(true);
                          }}
                          className="accent-emerald-600 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-mono font-bold text-xs text-slate-900">{item.key}.</span>
                      </label>

                      <input
                        type="text"
                        value={item.val}
                        onChange={(e) => {
                          item.setVal(e.target.value);
                          setIsFormDirty(true);
                        }}
                        placeholder={`Teks pilihan ${item.key} (mendukung rumus $...$)`}
                        className="flex-1 p-2 rounded-lg border border-transparent focus:border-brand-500 bg-transparent text-slate-900 font-medium focus:outline-hidden"
                      />

                      {formCorrectAnswer === item.key && (
                        <Badge variant="emerald" size="sm" className="font-mono mr-1">
                          Kunci Benar
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 6: Pembahasan Soal */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="ui-label block text-slate-700">
                  Pembahasan Konseptual Langkah-Demi-Langkah <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formExplanation}
                  onChange={(e) => {
                    setFormExplanation(e.target.value);
                    setIsFormDirty(true);
                  }}
                  placeholder="Jelaskan langkah demi langkah mengapa jawaban tersebut benar dan apa konsep dasar SMA yang digunakan..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:bg-white focus:border-brand-500 focus:outline-hidden leading-relaxed transition-colors"
                />

                {previewFormula && formExplanation && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-brand-200 space-y-1">
                    <span className="ui-label block text-brand-600">Pratinjau Pembahasan KaTeX:</span>
                    <div className="text-xs font-medium text-slate-900">
                      <MathRenderer text={formExplanation} />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCloseFormModal}
                >
                  Batal
                </Button>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => setFormStatus("draft")}
                  >
                    {isSubmitting && formStatus === "draft" ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Simpan Draft
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => setFormStatus("published")}
                  >
                    {isSubmitting && formStatus === "published" ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {editingQuestion ? "Simpan Perubahan" : "Publikasikan Soal"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KONFIRMASI HAPUS SOAL                                            */}
      {/* ========================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <Card className="max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Hapus Butir Soal Ini?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Soal ini akan dihapus permanen dari basis data Bank Soal. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 line-clamp-3">
              <MathRenderer text={deleteTarget.stem} />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                className="flex-1"
              >
                Ya, Hapus Soal
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: IMPOR SOAL DARI JSON                                             */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="ui-label block text-blue-600 mb-0.5">
                  Impor Massal
                </span>
                <h3 className="text-lg font-bold text-slate-900">Impor Butir Soal dari Dokumen JSON</h3>
              </div>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 whitespace-pre-line">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="font-medium">{importError}</span>
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <label className="ui-label text-slate-700">
                  Format JSON Array Soal SMA <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleLoadSampleJson}
                  className="text-[11px] font-bold text-brand-600 hover:underline"
                >
                  Salin Contoh Template JSON
                </button>
              </div>

              <textarea
                rows={10}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder={`[\n  {\n    "subjectId": "fisika",\n    "topicId": "dinamika",\n    "stem": "Pertanyaan...",\n    "options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },\n    "correctAnswer": "A",\n    "explanation": "Pembahasan..."\n  }\n]`}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-[11px] focus:bg-white focus:border-brand-500 focus:outline-hidden transition-colors"
              />

              <div className="flex items-center justify-between">
                <label className="ui-label text-slate-700">Status Bawaan Impor:</label>
                <select
                  value={importDefaultStatus}
                  onChange={(e) => setImportDefaultStatus(e.target.value as QuestionStatus)}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium text-xs focus:outline-hidden focus:border-brand-500"
                >
                  <option value="published">Publikasikan Langsung</option>
                  <option value="draft">Simpan Sebagai Draft</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  Batal
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isImporting || !importJsonText.trim()}
                >
                  {isImporting ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Proses Impor
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function BankSoalPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
          <p className="text-xs font-semibold">Memuat Bank Soal...</p>
        </div>
      }
    >
      <BankSoalContent />
    </React.Suspense>
  );
}
