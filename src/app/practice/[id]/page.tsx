"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PublicQuestion } from "@/types/question";
import { PracticeSession } from "@/types/session";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionNavigator } from "@/components/QuestionNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ReportQuestionModal } from "@/components/ReportQuestionModal";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  X,
  Check,
  Sparkles,
  Flame,
  Award,
  Zap,
  Clock,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { toast } from "@/lib/design-system/toast";
import { SoundToggle } from "@/components/SoundToggle";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

export default function PracticeRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<PracticeSession | null>(null);
  const [subjectName, setSubjectName] = useState<string>("");
  const [topicName, setTopicName] = useState<string>("");
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, "A" | "B" | "C" | "D" | "E" | null>>({});

  // STAGE 2 & STAGE 7: State Evaluasi Seketika & Lazy Adaptive Explanation
  const [evaluations, setEvaluations] = useState<
    Record<string, { isCorrect: boolean; correctAnswer: "A" | "B" | "C" | "D" | "E" }>
  >({});
  const [explanations, setExplanations] = useState<Record<string, Record<string, string>>>({});
  const [explanationLoading, setExplanationLoading] = useState<Record<string, boolean>>({});
  const [explanationError, setExplanationError] = useState<Record<string, string | null>>({});
  const [selectedDepth, setSelectedDepth] = useState<Record<string, "singkat" | "normal" | "mendalam">>({});

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);

  const [errorCode, setErrorCode] = useState<number | null>(null);

  // Load session data with resilience & retry capabilities
  const loadSession = useCallback(async (isRetry = false) => {
    if (isRetry) setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) {
        setErrorCode(res.status);
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          router.replace(`/login?redirect=/practice/${sessionId}`);
          return;
        }
        throw new Error(errData?.error || "Gagal memuat sesi latihan.");
      }

      const data = await res.json();
      if (data.isCompleted) {
        router.replace(`/results/${sessionId}`);
        return;
      }

      setSession(data.session);
      setSubjectName(data.subjectName);
      setTopicName(data.topicName);
      setQuestions(data.questions || []);
      setAnswers(data.answers || {});
      if (data.evaluations) {
        setEvaluations(data.evaluations);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat sesi latihan.");
    } finally {
      setLoading(false);
    }
  }, [sessionId, router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Lazy explanation fetcher with caching & depth support
  const fetchExplanation = useCallback(
    async (
      questionId: string,
      depth: "singkat" | "normal" | "mendalam" = "normal",
      forceRefresh = false
    ) => {
      if (!forceRefresh && explanations[questionId]?.[depth]) {
        return;
      }

      setExplanationLoading((prev) => ({ ...prev, [questionId]: true }));
      setExplanationError((prev) => ({ ...prev, [questionId]: null }));

      try {
        const res = await fetch(`/api/questions/${questionId}/explanation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            depth,
            sessionId,
            forceRefresh,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Gagal memuat pembahasan AI.");
        }

        setExplanations((prev) => ({
          ...prev,
          [questionId]: {
            ...(prev[questionId] || {}),
            [depth]: data.explanation,
          },
        }));
      } catch (err: any) {
        setExplanationError((prev) => ({
          ...prev,
          [questionId]: err.message || "Gagal memuat pembahasan.",
        }));
      } finally {
        setExplanationLoading((prev) => ({ ...prev, [questionId]: false }));
      }
    },
    [explanations, sessionId]
  );

  // Depth change handler
  const handleChangeDepth = useCallback(
    (questionId: string, depth: "singkat" | "normal" | "mendalam") => {
      setSelectedDepth((prev) => ({ ...prev, [questionId]: depth }));
      fetchExplanation(questionId, depth);
    },
    [fetchExplanation]
  );

  // Answer selection & instant evaluation in Mode Belajar
  const handleSelectAnswer = useCallback(
    async (key: "A" | "B" | "C" | "D" | "E") => {
      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      // Optimistic update
      setAnswers((prev) => ({ ...prev, [currentQ.id]: key }));
      setIsSavingAnswer(true);

      try {
        const res = await fetch(`/api/sessions/${sessionId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId: currentQ.id,
            selectedAnswer: key,
          }),
        });

        const data = await res.json();
        if (data.learningMode === "belajar" && data.correctAnswer) {
          setEvaluations((prev) => ({
            ...prev,
            [currentQ.id]: {
              isCorrect: data.isCorrect,
              correctAnswer: data.correctAnswer,
            },
          }));

          playSound(data.isCorrect ? "correct" : "wrong");

          // Start lazy explanation generation for current depth
          const curDepth = selectedDepth[currentQ.id] || "normal";
          fetchExplanation(currentQ.id, curDepth);
        }
      } catch (err) {
        console.error("Gagal menyimpan jawaban otomatis:", err);
        toast.warning("Gagal menyimpan ke cloud, jawaban tetap tersimpan di perangkat.");
      } finally {
        setIsSavingAnswer(false);
      }
    },
    [questions, currentIndex, sessionId, selectedDepth, fetchExplanation]
  );

  // Real-time elapsed session timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!session?.startedAt) return;
    const startTime = new Date(session.startedAt).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diff);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.startedAt]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    if (hh > 0) {
      return `${hh}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Submit session
  const handleSubmitQuiz = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Gagal mengirim jawaban latihan.");
      }

      playSound("complete");
      toast.success("Latihan selesai! Membuka hasil & evaluasi...");
      setIsSubmitModalOpen(false);
      router.push(`/results/${sessionId}`);
    } catch (err: any) {
      setError(err.message || "Gagal mengumpulkan jawaban.");
      toast.error(err.message || "Gagal mengumpulkan jawaban.");
      setIsSubmitting(false);
    }
  }, [sessionId, router]);

  // Keyboard navigation shortcuts (A-E / 1-5 to select, Left/Right arrows to navigate, Esc for modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if typing in form controls
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toUpperCase();
      if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
        return;
      }

      // Escape key handles closing modals
      if (e.key === "Escape") {
        if (isSubmitModalOpen) {
          setIsSubmitModalOpen(false);
          return;
        }
        if (isExitModalOpen) {
          setIsExitModalOpen(false);
          return;
        }
        if (isReportModalOpen) {
          setIsReportModalOpen(false);
          return;
        }
      }

      // If submit modal is open, Enter triggers submit
      if (isSubmitModalOpen) {
        if (e.key === "Enter" && !isSubmitting) {
          e.preventDefault();
          handleSubmitQuiz();
        }
        return;
      }

      // If other modals open, ignore quiz navigation
      if (isExitModalOpen || isReportModalOpen) {
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
        return;
      }

      // Option selection shortcuts (A..E or 1..5)
      const keyUpper = e.key.toUpperCase();
      const optionMap: Record<string, "A" | "B" | "C" | "D" | "E"> = {
        "1": "A",
        "A": "A",
        "2": "B",
        "B": "B",
        "3": "C",
        "C": "C",
        "4": "D",
        "D": "D",
        "5": "E",
        "E": "E",
      };

      if (optionMap[keyUpper] && questions.length > 0) {
        e.preventDefault();
        handleSelectAnswer(optionMap[keyUpper]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    questions.length,
    isSubmitModalOpen,
    isExitModalOpen,
    isReportModalOpen,
    isSubmitting,
    handleSubmitQuiz,
    handleSelectAnswer,
  ]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-[#64748B] space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#16A34A]" />
        <p className="text-xs font-semibold text-[#0F172A]">Menyiapkan Ruang Latihan SMA...</p>
      </div>
    );
  }

  if (error || !session || questions.length === 0) {
    const isNotFound = errorCode === 404 || error?.toLowerCase().includes("tidak ditemukan");
    const isForbidden = errorCode === 403 || error?.toLowerCase().includes("forbidden") || error?.toLowerCase().includes("hak akses");
    const isMaintenance = errorCode === 503 || error?.toLowerCase().includes("pemeliharaan") || error?.toLowerCase().includes("maintenance");

    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-card text-center space-y-4">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border",
            isForbidden
              ? "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
              : isMaintenance
              ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
              : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
          )}
        >
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#0F172A]">
          {isForbidden
            ? "Akses Ditolak"
            : isMaintenance
            ? "Sistem Dalam Pemeliharaan"
            : isNotFound
            ? "Sesi Latihan Tidak Ditemukan"
            : "Tidak Dapat Membuka Latihan"}
        </h2>
        <p className="text-xs text-[#64748B] leading-relaxed">
          {error || "Data butir soal tidak ditemukan atau sesi latihan sudah selesai dievaluasi."}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSession(true)}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Coba Lagi
          </Button>
          <Button variant="primary" size="sm" onClick={() => router.push("/generator")}>
            Buat Latihan Baru
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const questionIds = questions.map((q) => q.id);
  const answeredCount = questionIds.filter((id) => answers[id]).length;
  const unansweredCount = questions.length - answeredCount;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);
  const currentSelectedAnswer = answers[currentQuestion.id] || null;

  // Milestone encouragement messages
  const getEncouragement = () => {
    if (answeredCount === questions.length) return "Luar biasa! Semua butir soal telah terjawab.";
    if (progressPercent >= 75) return "Hebat! Sedikit lagi menuju garis akhir!";
    if (progressPercent >= 50) return "Mantap! Sudah setengah perjalanan latihan.";
    if (answeredCount > 0) return "Terus semangat dan perhatikan konsepnya.";
    return "Fokus & teliti setiap pilihan jawaban.";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 animate-fade-in pb-32 sm:pb-20 lg:pb-8">
      {/* 1. Gamified Top Header Bar & Continuous Progress */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-card overflow-hidden">
        {/* Continuous Progress Bar at Top */}
        <div className="w-full bg-[#E5E7EB] h-2 relative">
          <div
            className="h-full bg-gradient-to-r from-[#16A34A] to-[#84CC16] transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Exit button & Subject/Topic metadata */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsExitModalOpen(true)}
              className="p-2 rounded-xl bg-[#FAF9F5] hover:bg-[#F3F4EE] text-[#64748B] hover:text-[#0F172A] border border-[#CBD5E1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              title="Keluar ke Beranda (Jawaban tersimpan otomatis)"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
                  {subjectName}
                </span>
                <span className="text-[#94A3B8]">&bull;</span>
                <span className="text-xs text-[#0F172A] font-semibold">{topicName}</span>
                {session.config.mode === "hots" && (
                  <Badge variant="coral" size="xs">
                    HOTS
                  </Badge>
                )}
                {session.config.isRemedial && (
                  <Badge variant="sky" size="xs">
                    REMEDIAL
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {session.config.subtopic ? `Fokus: ${session.config.subtopic} • ` : ""}
                Soal {currentIndex + 1} dari {questions.length} &bull; {getEncouragement()}
              </p>
            </div>
          </div>

          {/* Right: Live Timer, Save status, Sound, & Submit button */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Live Elapsed Stopwatch */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FAF9F5] border border-[#CBD5E1] text-xs font-mono font-bold text-[#0F172A] shadow-2xs"
              title="Waktu pengerjaan latihan"
            >
              <Clock className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
              <span>{formatElapsed(elapsedSeconds)}</span>
            </div>

            {isSavingAnswer ? (
              <span className="text-[11px] text-[#16A34A] flex items-center gap-1.5 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
              </span>
            ) : (
              <span className="text-[11px] text-[#15803D] hidden md:flex items-center gap-1 font-medium bg-[#F0FDF4] px-2 py-0.5 rounded-md border border-[#BBF7D0]">
                <Check className="w-3 h-3 stroke-[3]" /> Tersimpan Otomatis
              </span>
            )}

            <SoundToggle />

            <Button
              variant="coral"
              size="sm"
              onClick={() => setIsSubmitModalOpen(true)}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Kumpulkan & Selesai
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main Question Grid (Left 3 cols: QuestionCard, Right 1 col: Navigator) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Question Area (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mobile Fast-Nav Strip (< 1024px) */}
          <div className="lg:hidden bg-white border border-[#E5E7EB] rounded-2xl p-3 shadow-card">
            <div className="flex items-center justify-between text-xs text-[#64748B] mb-2">
              <span className="font-bold text-[11px] uppercase tracking-wider text-[#0F172A]">
                Lompat Nomor Soal:
              </span>
              <Badge variant="green" size="sm">
                {answeredCount}/{questions.length} Terjawab
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
              {questions.map((q, idx) => {
                const isAns = !!answers[q.id];
                const isCur = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    ref={(el) => {
                      if (isCur && el) {
                        el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                      }
                    }}
                    onClick={() => setCurrentIndex(idx)}
                    title={`Nomor ${idx + 1}: ${isAns ? `Terjawab (${answers[q.id]})` : "Belum Dijawab"}`}
                    aria-label={`Nomor ${idx + 1}: ${isAns ? `Terjawab (${answers[q.id]})` : "Belum Dijawab"}`}
                    className={cn(
                      "h-10 min-w-[40px] px-2 rounded-xl text-xs font-bold transition-all shrink-0 flex flex-col items-center justify-center cursor-pointer select-none active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]",
                      isCur
                        ? "bg-[#16A34A] text-white shadow-xs font-extrabold ring-2 ring-[#16A34A] ring-offset-1"
                        : evaluations[q.id]
                        ? evaluations[q.id].isCorrect
                          ? "bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]"
                          : "bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]"
                        : isAns
                        ? "bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC]"
                        : "bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1]"
                    )}
                  >
                    <span>{idx + 1}</span>
                    {isAns && (
                      <span
                        className={cn(
                          "text-[9px] font-mono -mt-0.5 font-bold",
                          isCur ? "text-white" : "text-[#15803D]"
                        )}
                      >
                        {answers[q.id]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <ErrorBoundary
            fallbackTitle="Gagal Menampilkan Butir Soal"
            fallbackMessage="Terjadi kendala saat memuat konten rumus butir soal ini. Silakan coba klik muat ulang."
          >
            <QuestionCard
              key={currentQuestion.id}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              question={currentQuestion}
              selectedAnswer={currentSelectedAnswer}
              onSelectAnswer={handleSelectAnswer}
              onReportQuestion={() => setIsReportModalOpen(true)}
              learningMode={session?.config?.learningMode || "ujian"}
              evaluation={evaluations[currentQuestion.id] || null}
              explanation={
                explanations[currentQuestion.id]?.[selectedDepth[currentQuestion.id] || "normal"] || null
              }
              isExplanationLoading={Boolean(explanationLoading[currentQuestion.id])}
              explanationError={explanationError[currentQuestion.id] || null}
              explanationDepth={selectedDepth[currentQuestion.id] || "normal"}
              onChangeDepth={(d) => handleChangeDepth(currentQuestion.id, d)}
              onRetryExplanation={() =>
                fetchExplanation(currentQuestion.id, selectedDepth[currentQuestion.id] || "normal", true)
              }
            />
          </ErrorBoundary>

          {/* Stepper Navigation Buttons (Desktop) */}
          <div className="hidden sm:flex items-center justify-between pt-2 gap-3">
            <Button
              variant="outline"
              size="md"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Soal Sebelumnya <span className="text-[11px] text-[#94A3B8] font-normal ml-1">[←]</span>
            </Button>

            <div className="flex items-center gap-2">
              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                >
                  Soal Berikutnya <span className="text-[11px] text-white/80 font-normal ml-1">[→]</span>
                </Button>
              ) : (
                <Button
                  variant="coral"
                  size="md"
                  onClick={() => setIsSubmitModalOpen(true)}
                  rightIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Kumpulkan Jawaban
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Navigator (1 col on Desktop) */}
        <div className="lg:col-span-1 space-y-4">
          <QuestionNavigator
            totalQuestions={questions.length}
            currentIndex={currentIndex}
            answers={answers}
            questionIds={questionIds}
            onSelectIndex={(idx) => setCurrentIndex(idx)}
            evaluations={session?.config?.learningMode === "belajar" ? evaluations : undefined}
          />

          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 text-xs text-[#64748B] space-y-1.5 shadow-card">
            <p className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#16A34A]" /> Panduan Belajar:
            </p>
            <p className="leading-relaxed">
              Jawaban tersimpan otomatis. Anda bebas berpindah nomor dan mengubah pilihan sebelum mengumpulkan di akhir kuis.
            </p>
          </div>

          {/* Desktop Keyboard Shortcuts Card */}
          <div className="hidden lg:block bg-[#FAF9F5] border border-[#E5E7EB] rounded-2xl p-3.5 text-[11px] text-[#64748B] space-y-2">
            <p className="font-bold text-[#0F172A] flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" /> Shortcut Keyboard:
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] font-mono text-[#0F172A] font-bold text-[10px] shadow-2xs">A–E</kbd>
                <span>Pilih Opsi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] font-mono text-[#0F172A] font-bold text-[10px] shadow-2xs">1–5</kbd>
                <span>Alternatif Opsi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] font-mono text-[#0F172A] font-bold text-[10px] shadow-2xs">←</kbd>
                <span>Sebelumnya</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] font-mono text-[#0F172A] font-bold text-[10px] shadow-2xs">→</kbd>
                <span>Berikutnya</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Floating Bottom Action Sheet on Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] p-3 shadow-2xl flex flex-col space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          {currentSelectedAnswer ? (
            <div className="flex items-center gap-1.5 font-bold text-[#15803D]">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Opsi {currentSelectedAnswer} dipilih</span>
            </div>
          ) : (
            <span className="text-[#64748B] text-[11px]">Pilih salah satu jawaban A–E</span>
          )}

          <span className="font-mono text-xs text-[#64748B]">
            {answeredCount}/{questions.length} Selesai
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentIndex > 0 && (
            <Button
              variant="outline"
              size="md"
              className="px-3"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              title="Soal Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}

          {currentIndex < questions.length - 1 ? (
            <Button
              variant={currentSelectedAnswer ? "primary" : "secondary"}
              size="md"
              className="flex-1 font-bold"
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              rightIcon={<ChevronRight className="w-4 h-4" />}
            >
              {currentSelectedAnswer ? "Lanjut ke Soal Berikutnya" : "Lewati Soal Ini"}
            </Button>
          ) : (
            <Button
              variant="coral"
              size="md"
              className="flex-1 font-bold"
              onClick={() => setIsSubmitModalOpen(true)}
              rightIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Kumpulkan Kuis
            </Button>
          )}
        </div>
      </div>

      {/* 4. Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsSubmitModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Konfirmasi Selesai Latihan
                </h3>
                <p className="text-xs text-[#64748B]">Pastikan seluruh butir soal telah diperiksa.</p>
              </div>
            </div>

            <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E5E7EB] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Total Soal:</span>
                <span className="font-bold text-[#0F172A]">{questions.length} butir</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Sudah Terjawab:</span>
                <span className="font-bold text-[#16A34A]">{answeredCount} butir</span>
              </div>
              {unansweredCount > 0 && (
                <div className="flex justify-between text-[#DC2626] font-semibold pt-1.5 border-t border-[#E5E7EB]">
                  <span>Belum Terjawab:</span>
                  <span>{unansweredCount} butir</span>
                </div>
              )}
            </div>

            {unansweredCount > 0 ? (
              <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] leading-relaxed">
                <strong>Perhatian:</strong> Masih terdapat <strong>{unansweredCount} butir soal</strong> yang belum Anda jawab. Soal yang dikosongkan akan dihitung keliru pada evaluasi skor.
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#15803D] leading-relaxed">
                Hebat! Seluruh butir soal telah terjawab lengkap. Anda dapat langsung meninjau perolehan skor terkalibrasi dan pembahasan konsep mendalam.
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-2">
              <Button
                variant="outline"
                className="w-1/2"
                disabled={isSubmitting}
                onClick={() => setIsSubmitModalOpen(false)}
              >
                Periksa Lagi
              </Button>
              <Button
                variant="coral"
                className="w-1/2"
                isLoading={isSubmitting}
                onClick={handleSubmitQuiz}
              >
                Ya, Kumpulkan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Exit Confirmation Modal */}
      {isExitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsExitModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA] flex items-center justify-center shrink-0">
                <X className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Tinggalkan Sesi Latihan?
                </h3>
                <p className="text-xs text-[#64748B]">Jawaban Anda tetap tersimpan dengan aman.</p>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed bg-[#FAF9F5] p-3.5 rounded-2xl border border-[#E5E7EB]">
              Progres dan {answeredCount} jawaban yang telah Anda pilih tersimpan otomatis di server. Anda dapat melanjutkan kembali sesi ini kapan saja melalui menu <strong>Beranda</strong>.
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={() => setIsExitModalOpen(false)}
              >
                Lanjutkan Latihan
              </Button>
              <Button
                variant="primary"
                className="w-1/2"
                onClick={() => router.push("/")}
              >
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Report Question Modal */}
      <ReportQuestionModal
        questionId={currentQuestion?.id || ""}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}
