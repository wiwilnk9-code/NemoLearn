"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PracticeSessionResult, QuestionResultItem } from "@/types/session";
import { MathRenderer } from "@/components/MathRenderer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ReportQuestionModal } from "@/components/ReportQuestionModal";
import { generateRemedialPdf } from "@/lib/pdf/remedial-pdf";
import { formatIndonesianScore } from "@/lib/scoring/format";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Download,
  Flag,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertTriangle,
  BookOpen,
  Info,
  Check,
  X,
  Clock,
  Award,
  BarChart2,
  ListFilter,
  ChevronRight,
  Layers,
  Target,
  FileText,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SoundToggle } from "@/components/SoundToggle";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";

// Custom hook for smooth score count-up animation
function useCountUp(target: number, duration: number = 800): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!target || target <= 0) {
      setValue(0);
      return;
    }

    let startTime: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Easing: easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(eased * target);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration]);

  return value;
}

// Helper to format session duration
function formatSessionDuration(startedAt?: string, completedAt?: string): string | null {
  if (!startedAt || !completedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffSec = Math.max(0, Math.round((end - start) / 1000));
  if (diffSec < 60) return `${diffSec} dtk`;
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins} menit`;
}

// Circular Donut Gauge Component (SVG)
interface ScoreDonutProps {
  correct: number;
  wrong: number;
  empty: number;
  total: number;
  accuracy: number;
}

const ScoreDonut: React.FC<ScoreDonutProps> = ({
  correct,
  wrong,
  empty,
  total,
  accuracy,
}) => {
  const r = 52;
  const c = 2 * Math.PI * r; // ~326.72

  const safeTotal = total > 0 ? total : 1;
  const fCorrect = Math.max(0, correct / safeTotal);
  const fWrong = Math.max(0, wrong / safeTotal);
  const fEmpty = Math.max(0, empty / safeTotal);

  const lenCorrect = fCorrect * c;
  const lenWrong = fWrong * c;
  const lenEmpty = fEmpty * c;

  const animatedAccuracy = useCountUp(accuracy, 850);

  return (
    <div className="relative flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 shrink-0">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
        {/* Track background */}
        <circle
          cx="64"
          cy="64"
          r={r}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="12"
          fill="transparent"
        />

        {/* Slice 1: Correct (Fresh Botanical Green) */}
        {correct > 0 && (
          <circle
            cx="64"
            cy="64"
            r={r}
            stroke="#16A34A"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={`${lenCorrect} ${c}`}
            strokeDashoffset="0"
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}

        {/* Slice 2: Wrong (Solar Red/Coral) */}
        {wrong > 0 && (
          <circle
            cx="64"
            cy="64"
            r={r}
            stroke="#EF4444"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={`${lenWrong} ${c}`}
            strokeDashoffset={-(lenCorrect)}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}

        {/* Slice 3: Empty (Muted Slate) */}
        {empty > 0 && (
          <circle
            cx="64"
            cy="64"
            r={r}
            stroke="#94A3B8"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={`${lenEmpty} ${c}`}
            strokeDashoffset={-(lenCorrect + lenWrong)}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        )}
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight tabular-nums">
          {Math.round(animatedAccuracy)}%
        </span>
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
          Akurasi
        </span>
      </div>
    </div>
  );
};

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<PracticeSessionResult | null>(null);
  const [subjectName, setSubjectName] = useState<string>("");
  const [topicName, setTopicName] = useState<string>("");

  // STAGE 3, 4, 7: Adaptive Explanation State
  const [explanations, setExplanations] = useState<Record<string, Record<string, string>>>({});
  const [explanationLoading, setExplanationLoading] = useState<Record<string, boolean>>({});
  const [explanationError, setExplanationError] = useState<Record<string, string | null>>({});
  const [selectedDepth, setSelectedDepth] = useState<Record<string, "singkat" | "normal" | "mendalam">>({});

  // Review filter tab state: "all" | "wrong_empty" | "correct"
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong_empty" | "correct">("all");

  // Remedial action state
  const [isCreatingRemedial, setIsCreatingRemedial] = useState(false);
  const [remedialError, setRemedialError] = useState<string | null>(null);

  // Reporting modal state
  const [reportingQuestionId, setReportingQuestionId] = useState<string | null>(null);

  // PDF modal state
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [includePdfExplanations, setIncludePdfExplanations] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Keyboard accessibility: dismiss PDF export modal on Escape key
  useEffect(() => {
    if (!isPdfModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isGeneratingPdf) {
        setIsPdfModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPdfModalOpen, isGeneratingPdf]);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Gagal memuat hasil latihan.");
        }
        return res.json();
      })
      .then((data) => {
        if (!data.isCompleted) {
          router.replace(`/practice/${sessionId}`);
          return;
        }
        setResult(data.result);
        setSubjectName(data.subjectName);
        setTopicName(data.topicName);
        // Play gamified completion sound if enabled by user
        setTimeout(() => {
          if (data.result?.scorePercentage >= 70) {
            playSound("complete");
          } else {
            playSound("milestone");
          }
        }, 300);
      })
      .catch((err) => {
        setError(err.message || "Gagal memuat hasil evaluasi.");
      })
      .finally(() => setLoading(false));
  }, [sessionId, router]);

  // STAGE 1, 3, 4: Lazy Adaptive Explanation Fetcher
  const fetchExplanation = async (
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
  };

  const handleLaunchRemedial = async () => {
    setIsCreatingRemedial(true);
    setRemedialError(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/remedial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Gagal membuat sesi remedial.");
      }

      router.push(`/practice/${data.remedialSessionId}`);
    } catch (err: any) {
      setRemedialError(err.message || "Gagal membuat sesi remedial.");
      setIsCreatingRemedial(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    setIsGeneratingPdf(true);

    try {
      const reviewItems = result.items.filter((item) => !item.isCorrect);
      const itemsToExport = reviewItems.length > 0 ? reviewItems : result.items;

      const doc = generateRemedialPdf({
        sessionTitle: `${subjectName} - ${topicName}`,
        subjectName,
        topicName,
        userName: "Siswa SMA",
        dateStr: new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        items: itemsToExport,
        includeExplanations: includePdfExplanations,
      });

      doc.save(`Evaluasi_NemoLearn_${sessionId.slice(0, 12)}.pdf`);
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error("Gagal men-generate PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Diagnostic Groupings: Topic-wise and Difficulty breakdown
  const topicBreakdown = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, { total: number; correct: number }>();

    result.items.forEach((item) => {
      const key = item.question.subtopic || topicName || "Konsep Inti";
      const current = map.get(key) || { total: 0, correct: 0 };
      current.total += 1;
      if (item.isCorrect) current.correct += 1;
      map.set(key, current);
    });

    return Array.from(map.entries()).map(([subtopic, data]) => ({
      subtopic,
      total: data.total,
      correct: data.correct,
      percentage: Math.round((data.correct / data.total) * 100),
    }));
  }, [result, topicName]);

  const difficultyBreakdown = useMemo(() => {
    if (!result) return [];
    const map = new Map<string, { total: number; correct: number }>();

    result.items.forEach((item) => {
      const diff = item.question.difficulty || "sedang";
      const key =
        diff === "mudah"
          ? "Mudah"
          : diff === "sedang"
          ? "Sedang"
          : diff === "sulit"
          ? "Sulit"
          : "HOTS";

      const current = map.get(key) || { total: 0, correct: 0 };
      current.total += 1;
      if (item.isCorrect) current.correct += 1;
      map.set(key, current);
    });

    const order = ["Mudah", "Sedang", "Sulit", "HOTS"];
    return order
      .filter((k) => map.has(k))
      .map((key) => {
        const data = map.get(key)!;
        return {
          difficulty: key,
          total: data.total,
          correct: data.correct,
          percentage: Math.round((data.correct / data.total) * 100),
        };
      });
  }, [result]);

  // Filtered review items based on reviewFilter
  const filteredReviewItems = useMemo(() => {
    if (!result) return [];
    if (reviewFilter === "wrong_empty") {
      return result.items.filter((item) => !item.isCorrect);
    }
    if (reviewFilter === "correct") {
      return result.items.filter((item) => item.isCorrect);
    }
    return result.items;
  }, [result, reviewFilter]);

  // Target score for count-up animation
  const isIrt =
    result?.scoreDetail?.method === "irt" || result?.session?.scoringMethod === "irt";
  const numericScore =
    result?.scoreDetail?.scoreValue ??
    result?.session?.score ??
    result?.scorePercentage ??
    0;
  const animatedScore = useCountUp(numericScore, 900);

  if (loading) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-[#64748B] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#0F172A]">Menghitung Skor & Diagnostik Belajar...</p>
          <p className="text-xs text-[#64748B] mt-0.5">Memproses akurasi, estimasi IRT, dan pembahasan butir soal.</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] flex items-center justify-center mx-auto">
          <XCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#0F172A]">Gagal Menampilkan Hasil</h2>
        <p className="text-xs text-[#64748B] leading-relaxed">
          {error || "Data evaluasi tidak tersedia atau sesi belum diselesaikan."}
        </p>
        <Link href="/">
          <Button variant="primary" size="sm">
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    );
  }

  const {
    session,
    totalQuestions,
    correctCount,
    wrongCount,
    emptyCount,
    scorePercentage,
    items,
    weakTopics,
  } = result;

  const hasMistakes = wrongCount > 0 || emptyCount > 0;
  const accuracyPercent = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
  const durationLabel = formatSessionDuration(session?.startedAt, session?.completedAt);

  // Celebratory headline & subtext
  const headline =
    accuracyPercent >= 85
      ? "Luar Biasa! Pemahaman Sangat Mendalam 🎉"
      : accuracyPercent >= 65
      ? "Kerja Bagus! Terus Tingkatkan 🚀"
      : "Semangat! Setiap Kesalahan Adalah Peluang Belajar 💪";

  const subHeadline =
    accuracyPercent >= 85
      ? "Anda telah menguasai konsep pada paket soal ini dengan sangat baik. Pertahankan prestasimu!"
      : accuracyPercent >= 65
      ? "Fondasi materi sudah terbentuk. Tinjau kembali beberapa butir soal di bawah untuk mengunci pemahaman penuh."
      : "Jangan berkecil hati. Manfaatkan pembahasan langkah demi langkah dan latihan remedial untuk menutup celah pemahaman.";

  const formattedDate = session?.completedAt
    ? new Date(session.completedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : session?.startedAt
    ? new Date(session.startedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-fade-in">
      {/* 1. HERO EVALUATION BANNER (Tutopiya & SkillUp Inspired) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] bg-[#0F172A] text-white p-6 sm:p-9 shadow-lg border border-[#334155]">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#16A34A]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/4 w-60 h-60 bg-[#EA580C]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Text & Metrics */}
          <div className="space-y-4 max-w-xl">
            {/* Subject, Topic, Date Badges & Sound Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#16A34A]/25 border border-[#16A34A]/50 text-[#86EFAC] text-xs font-bold tracking-wide">
                  {subjectName}
                </span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-xs font-semibold text-slate-200">{topicName}</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-xs text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formattedDate}
                </span>
              </div>
              <SoundToggle />
            </div>

            {/* Title & Motivational Feedback */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[#F1F5F9] text-[11px] font-bold uppercase tracking-wider mb-2">
                <Award className="w-3.5 h-3.5 text-[#FACC15]" /> Evaluasi Selesai
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {headline}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                {subHeadline}
              </p>
            </div>

            {/* Quick Stat Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              {/* Score Metric */}
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3 text-center sm:text-left">
                <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                  {isIrt ? "Skor IRT 3-PL" : "Skor Akurasi"}
                </p>
                <p className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-0.5 tabular-nums">
                  {formatIndonesianScore(animatedScore)}
                  {!isIrt && "%"}
                </p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  {isIrt ? "Skala 200–1000" : "Skala 0–100"}
                </p>
              </div>

              {/* Benar */}
              <div className="bg-[#16A34A]/20 border border-[#16A34A]/40 rounded-2xl p-3 text-center sm:text-left">
                <p className="text-[10px] uppercase font-bold text-[#86EFAC] tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Check className="w-3 h-3" /> Benar
                </p>
                <p className="text-xl sm:text-2xl font-extrabold font-mono text-[#4ADE80] mt-0.5">
                  {correctCount}
                </p>
                <p className="text-[10px] text-[#BBF7D0] mt-0.5">dari {totalQuestions} butir</p>
              </div>

              {/* Salah */}
              <div className="bg-[#EF4444]/20 border border-[#EF4444]/40 rounded-2xl p-3 text-center sm:text-left">
                <p className="text-[10px] uppercase font-bold text-[#FCA5A5] tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <X className="w-3 h-3" /> Salah
                </p>
                <p className="text-xl sm:text-2xl font-extrabold font-mono text-[#F87171] mt-0.5">
                  {wrongCount}
                </p>
                <p className="text-[10px] text-[#FECACA] mt-0.5">butir keliru</p>
              </div>

              {/* Durasi / Kosong */}
              <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-3 text-center sm:text-left">
                <p className="text-[10px] uppercase font-bold text-slate-300 tracking-wider flex items-center justify-center sm:justify-start gap-1">
                  <Clock className="w-3 h-3" /> Durasi
                </p>
                <p className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-0.5">
                  {durationLabel || "—"}
                </p>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  {emptyCount > 0 ? `${emptyCount} kosong` : "selesai penuh"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Circular Donut Visualization */}
          <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-5 sm:p-6">
            <ScoreDonut
              correct={correctCount}
              wrong={wrongCount}
              empty={emptyCount}
              total={totalQuestions}
              accuracy={accuracyPercent}
            />

            {/* Donut Legend */}
            <div className="flex items-center gap-3.5 mt-3 text-xs text-slate-200">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                Benar ({correctCount})
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                Salah ({wrongCount})
              </span>
              {emptyCount > 0 && (
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
                  Kosong ({emptyCount})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scoring Notes Transparency Box */}
        {result.scoreDetail?.scoringNotes && (
          <div className="relative z-10 mt-6 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#86EFAC] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">Metode Penilaian:</strong>{" "}
              {result.scoreDetail.scoringNotes}
            </p>
          </div>
        )}
      </div>

      {/* 2. DIAGNOSTIC PERFORMANCE & RECOMMENDED NEXT (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Performance Breakdown by Subtopic & Difficulty */}
        <div className="lg:col-span-7 space-y-6">
          {/* Topic-wise Performance Card */}
          <Card className="rounded-3xl border-[#E2E8F0] shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-[#0F172A]">
                      Penguasaan per Submateri
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tingkat akurasi pemahaman konsep pada setiap subtopik
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="green" size="sm">
                  {topicBreakdown.length} Topik
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              {topicBreakdown.map((topic, idx) => {
                const barColor =
                  topic.percentage >= 80
                    ? "bg-[#16A34A]"
                    : topic.percentage >= 50
                    ? "bg-[#EA580C]"
                    : "bg-[#DC2626]";

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F172A]">{topic.subtopic}</span>
                      <span className="font-mono text-[#64748B]">
                        <strong className="text-[#0F172A]">{topic.correct}</strong> / {topic.total}{" "}
                        &bull; {topic.percentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", barColor)}
                        style={{ width: `${topic.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Difficulty Breakdown Card */}
          <Card className="rounded-3xl border-[#E2E8F0] shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#2563EB]">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-[#0F172A]">
                      Distribusi Tingkat Kesulitan
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Akurasi pengerjaan berdasarkan kompleksitas butir soal
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="sky" size="sm">
                  {difficultyBreakdown.length} Level
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              {difficultyBreakdown.map((diff, idx) => {
                const barColor =
                  diff.percentage >= 80
                    ? "bg-[#16A34A]"
                    : diff.percentage >= 50
                    ? "bg-[#F59E0B]"
                    : "bg-[#DC2626]";

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0F172A]">{diff.difficulty}</span>
                        {diff.difficulty === "HOTS" && (
                          <Badge variant="coral" size="xs">
                            HOTS
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono text-[#64748B]">
                        <strong className="text-[#0F172A]">{diff.correct}</strong> / {diff.total}{" "}
                        &bull; {diff.percentage}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#F1F5F9] overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", barColor)}
                        style={{ width: `${diff.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Weak Topics Diagnostic Alert (if any) */}
          {weakTopics.length > 0 && (
            <div className="p-4 rounded-3xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/20 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#92400E]">
                  Perlu Pendalaman: {weakTopics.length} Konsep Belum Tuntas
                </h4>
                <p className="text-xs text-[#B45309] leading-relaxed">
                  Berdasarkan jawaban keliru pada paket ini, disarankan untuk mempelajari kembali:{" "}
                  <strong>{weakTopics.map((w) => w.subtopic || w.topicName).join(", ")}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Recommended Next Steps & User Actions */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-3xl border-[#E2E8F0] shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#EA580C]">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#0F172A]">
                    Langkah Selanjutnya
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tindakan terbaik untuk memperkuat penguasaan materi
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {/* Action 1: Remedial Session (if has mistakes) */}
              {hasMistakes && (
                <button
                  type="button"
                  onClick={handleLaunchRemedial}
                  disabled={isCreatingRemedial}
                  className="w-full text-left p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] hover:border-[#16A34A] transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shrink-0">
                        {isCreatingRemedial ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#0F172A] group-hover:text-[#16A34A] transition-colors">
                          Mulai Sesi Remedial
                        </p>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Latih ulang {wrongCount + emptyCount} butir yang keliru untuk mengunci konsep.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              )}

              {/* Action 2: Review Explanations */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("answer-review-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full text-left p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] text-[#4F46E5] flex items-center justify-center shrink-0 shadow-xs">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#0F172A] group-hover:text-[#4F46E5] transition-colors">
                        Tinjau Kunci & Pembahasan
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Lihat uraian langkah solusi lengkap per butir soal.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#4F46E5] group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>

              {/* Action 3: Export PDF */}
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="w-full text-left p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] text-[#EA580C] flex items-center justify-center shrink-0 shadow-xs">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#0F172A] group-hover:text-[#EA580C] transition-colors">
                        Ekspor Lembar Evaluasi PDF
                      </p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Unduh dokumen PDF rapi siap cetak untuk belajar offline.
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#EA580C] group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>

              {/* Action 4: New Practice */}
              <Link href="/generator" className="block">
                <div className="w-full text-left p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all group cursor-pointer">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] text-[#16A34A] flex items-center justify-center shrink-0 shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-[#0F172A] group-hover:text-[#16A34A] transition-colors">
                          Latihan Paket Baru
                        </p>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Eksplorasi topik lain atau sesuaikan tingkat tantangan.
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Return to Dashboard Button */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full rounded-2xl">
                Kembali ke Beranda
              </Button>
            </Link>
          </div>

          {remedialError && (
            <p className="text-xs text-[#DC2626] font-medium p-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA]">
              {remedialError}
            </p>
          )}
        </div>
      </div>

      {/* 3. ANSWER REVIEW SECTION (Pembahasan Lengkap dengan Navigasi & Filter) */}
      <div id="answer-review-section" className="space-y-6 pt-4">
        {/* Review Header & Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                Kunci Jawaban & Pembahasan Konsep
              </h2>
            </div>
            <p className="text-xs text-[#64748B]">
              Pelajari pembahasan langkah demi langkah dan periksa kembali respon Anda.
            </p>
          </div>

          {/* Filter Pills: All, Mistakes Only, Correct Only */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setReviewFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                reviewFilter === "all"
                  ? "bg-[#0F172A] text-white shadow-xs"
                  : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              )}
            >
              Semua Soal ({totalQuestions})
            </button>

            {hasMistakes && (
              <button
                type="button"
                onClick={() => setReviewFilter("wrong_empty")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  reviewFilter === "wrong_empty"
                    ? "bg-[#EF4444] text-white shadow-xs"
                    : "bg-white border border-[#E2E8F0] text-[#EF4444] hover:bg-[#FEF2F2]"
                )}
              >
                Perlu Ditinjau ({wrongCount + emptyCount})
              </button>
            )}

            <button
              type="button"
              onClick={() => setReviewFilter("correct")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                reviewFilter === "correct"
                  ? "bg-[#16A34A] text-white shadow-xs"
                  : "bg-white border border-[#E2E8F0] text-[#16A34A] hover:bg-[#F0FDF4]"
              )}
            >
              Jawaban Benar ({correctCount})
            </button>
          </div>
        </div>

        {/* Quick Question Jump Strip */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-bold text-[#0F172A]">Navigasi Cepat Nomor Soal:</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Benar
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" /> Salah
              </span>
              {emptyCount > 0 && (
                <span className="flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#94A3B8]" /> Kosong
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {items.map((item) => {
              const dotColor = item.isCorrect
                ? "bg-[#16A34A] text-white border-[#16A34A]"
                : !item.selectedAnswer
                ? "bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1]"
                : "bg-[#EF4444] text-white border-[#EF4444]";

              return (
                <button
                  key={item.question.id}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`review-item-${item.questionNumber}`);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={cn(
                    "w-8 h-8 rounded-lg text-xs font-bold font-mono border transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center",
                    dotColor
                  )}
                  title={`Soal No. ${item.questionNumber} (${item.isCorrect ? "Benar" : !item.selectedAnswer ? "Kosong" : "Salah"})`}
                >
                  {item.questionNumber}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Review Cards List */}
        <div className="space-y-6">
          {filteredReviewItems.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded-3xl space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto" />
              <h3 className="text-base font-bold text-[#0F172A]">Tidak Ada Soal pada Kategori Ini</h3>
              <p className="text-xs text-[#64748B]">
                Seluruh butir soal telah memenuhi filter pencarian Anda.
              </p>
            </div>
          ) : (
            filteredReviewItems.map((item) => {
              const isCorrect = item.isCorrect;
              const isUserEmpty = !item.selectedAnswer;

              return (
                <ErrorBoundary
                  key={item.question.id}
                  fallbackTitle={`Gagal memuat butir soal No. ${item.questionNumber}`}
                >
                  <div
                    id={`review-item-${item.questionNumber}`}
                    className={cn(
                      "bg-white border rounded-3xl p-5 sm:p-7 transition-all shadow-xs space-y-5 scroll-mt-20",
                      isCorrect
                        ? "border-[#BBF7D0]"
                        : "border-[#FECACA]"
                    )}
                  >
                    {/* Header Row: Question number, status, tags, and report button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-8 h-8 rounded-xl bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold font-mono">
                          {item.questionNumber}
                        </span>

                        {isCorrect ? (
                          <Badge variant="green" size="md">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-[#16A34A]" /> Jawaban Benar
                          </Badge>
                        ) : isUserEmpty ? (
                          <Badge variant="slate" size="md">
                            <HelpCircle className="w-3.5 h-3.5 mr-1 text-[#64748B]" /> Tidak Dijawab
                          </Badge>
                        ) : (
                          <Badge variant="rose" size="md">
                            <XCircle className="w-3.5 h-3.5 mr-1 text-[#DC2626]" /> Jawaban Salah
                          </Badge>
                        )}

                        {item.question.difficulty && (
                          <Badge
                            variant={item.question.difficulty === "hots" ? "coral" : "outline"}
                            size="sm"
                          >
                            {item.question.difficulty.toUpperCase()}
                          </Badge>
                        )}

                        {item.question.subtopic && (
                          <span className="text-xs font-medium text-[#64748B] hidden sm:inline">
                            &bull; {item.question.subtopic}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setReportingQuestionId(item.question.id)}
                        className="text-xs text-[#64748B] hover:text-[#DC2626] flex items-center gap-1.5 transition-colors p-1.5 rounded-lg hover:bg-[#FEF2F2] cursor-pointer"
                        title="Laporkan kekeliruan atau ketidaksesuaian butir soal"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>Laporkan Soal</span>
                      </button>
                    </div>

                    {/* Question Stem (Text & LaTeX) */}
                    <div className="text-sm sm:text-base font-medium text-[#0F172A] leading-relaxed">
                      <MathRenderer text={item.question.stem} />
                    </div>

                    {/* Optional Image */}
                    {item.question.imageUrl && (
                      <div className="p-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] text-center">
                        <img
                          src={item.question.imageUrl}
                          alt="Ilustrasi Soal"
                          className="max-h-56 mx-auto object-contain rounded-xl"
                        />
                      </div>
                    )}

                    {/* Options Review Grid */}
                    <div className="space-y-2.5">
                      {item.question.options.map((opt) => {
                        const isKey = opt.key === item.correctAnswer;
                        const isChosen = opt.key === item.selectedAnswer;

                        return (
                          <div
                            key={opt.key}
                            className={cn(
                              "p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3.5 text-xs sm:text-sm transition-all",
                              isKey
                                ? "bg-[#F0FDF4] border-[#16A34A] text-[#15803D] font-semibold"
                                : isChosen && !isCorrect
                                ? "bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]"
                                : "bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]"
                            )}
                          >
                            {/* Option letter pill */}
                            <div
                              className={cn(
                                "w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5",
                                isKey
                                  ? "bg-[#16A34A] text-white"
                                  : isChosen && !isCorrect
                                  ? "bg-[#EF4444] text-white"
                                  : "bg-white border border-[#CBD5E1] text-[#64748B]"
                              )}
                            >
                              {opt.key}
                            </div>

                            {/* Option text with MathRenderer */}
                            <div className="grow pt-0.5 leading-relaxed">
                              <MathRenderer text={opt.text} />
                            </div>

                            {/* Tags */}
                            <div className="shrink-0 flex items-center gap-1.5">
                              {isKey && (
                                <Badge variant="green" size="sm">
                                  Kunci Benar
                                </Badge>
                              )}
                              {isChosen && !isKey && (
                                <Badge variant="rose" size="sm">
                                  Pilihan Anda (Salah)
                                </Badge>
                              )}
                              {isChosen && isKey && (
                                <Badge variant="green" size="sm">
                                  Pilihan Anda (Tepat)
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Adaptive Conceptual Solution Box (Stage 1, 3, 4, 7) */}
                    <div className="bg-[#FAF9F5] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1.5 uppercase tracking-wider">
                            <Sparkles className="w-4 h-4 text-[#16A34A]" /> Pembahasan Konsep
                          </span>
                          <span className="text-xs font-mono font-bold text-[#0F172A] bg-white px-2 py-0.5 rounded-lg border border-[#E2E8F0]">
                            Kunci: <strong>{item.correctAnswer}</strong>
                          </span>
                        </div>

                        {/* Depth Level Toggles */}
                        <div className="flex items-center gap-1 p-0.5 bg-white rounded-xl border border-[#E2E8F0]">
                          {(["singkat", "normal", "mendalam"] as const).map((d) => {
                            const curDepth = selectedDepth[item.question.id] || "normal";
                            return (
                              <button
                                key={d}
                                type="button"
                                disabled={explanationLoading[item.question.id]}
                                onClick={() => {
                                  setSelectedDepth((prev) => ({ ...prev, [item.question.id]: d }));
                                  fetchExplanation(item.question.id, d);
                                }}
                                className={cn(
                                  "px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer capitalize",
                                  curDepth === d
                                    ? "bg-[#16A34A] text-white shadow-xs"
                                    : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                                )}
                              >
                                {d === "normal" ? "Normal" : d}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Content rendering state */}
                      {(() => {
                        const curDepth = selectedDepth[item.question.id] || "normal";
                        const isLoading = explanationLoading[item.question.id];
                        const err = explanationError[item.question.id];
                        const content =
                          explanations[item.question.id]?.[curDepth] ||
                          (curDepth === "normal" && item.explanation && item.explanation.length > 15
                            ? item.explanation
                            : null);

                        if (isLoading) {
                          return (
                            <div className="space-y-2 py-2 animate-fade-in">
                              <div className="flex items-center gap-2 text-xs font-semibold text-[#16A34A]">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#16A34A]" />
                                <span>Menyiapkan pembahasan {curDepth}...</span>
                              </div>
                              <div className="space-y-1.5 animate-pulse pt-1">
                                <div className="h-3.5 bg-[#E2E8F0] rounded w-1/3"></div>
                                <div className="h-3 bg-[#E2E8F0] rounded w-full"></div>
                                <div className="h-3 bg-[#E2E8F0] rounded w-5/6"></div>
                              </div>
                            </div>
                          );
                        }

                        if (err) {
                          return (
                            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between gap-2 text-xs text-[#991B1B]">
                              <span>{err}</span>
                              <button
                                type="button"
                                onClick={() => fetchExplanation(item.question.id, curDepth, true)}
                                className="inline-flex items-center gap-1 font-bold text-[#DC2626] hover:underline cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" /> Coba Lagi
                              </button>
                            </div>
                          );
                        }

                        if (content) {
                          return (
                            <div className="text-xs sm:text-sm text-[#0F172A] leading-relaxed animate-fade-in space-y-2">
                              <MathRenderer text={content} />
                            </div>
                          );
                        }

                        return (
                          <div className="flex items-center justify-between text-xs text-[#64748B] py-1">
                            <span>Pembahasan ({curDepth}) siap dibuka.</span>
                            <button
                              type="button"
                              onClick={() => fetchExplanation(item.question.id, curDepth)}
                              className="font-bold text-[#16A34A] hover:underline cursor-pointer"
                            >
                              Muat Pembahasan
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </ErrorBoundary>
              );
            })
          )}
        </div>
      </div>

      {/* PDF Export Modal */}
      {isPdfModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => !isGeneratingPdf && setIsPdfModalOpen(false)}
        >
          <div
            className="bg-white border border-[#E2E8F0] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA] flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Ekspor Lembar Evaluasi PDF
                </h3>
                <p className="text-xs text-[#64748B]">
                  Dokumen terstruktur siap cetak untuk arsip belajar mandiri.
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Mata Pelajaran:</span>
                <span className="font-bold text-[#0F172A]">{subjectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Materi:</span>
                <span className="font-bold text-[#0F172A]">{topicName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Fokus Butir:</span>
                <span className="font-bold text-[#EA580C]">
                  {wrongCount + emptyCount > 0
                    ? `${wrongCount + emptyCount} Butir Perlu Remedial`
                    : `${totalQuestions} Butir Soal`}
                </span>
              </div>
            </div>

            <div>
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-[#E2E8F0] cursor-pointer hover:border-[#16A34A] transition-colors">
                <input
                  type="checkbox"
                  checked={includePdfExplanations}
                  onChange={(e) => setIncludePdfExplanations(e.target.checked)}
                  className="w-4 h-4 accent-[#16A34A] rounded cursor-pointer mt-0.5"
                />
                <div className="text-xs">
                  <p className="font-bold text-[#0F172A]">Sertakan Kunci & Pembahasan Lengkap</p>
                  <p className="text-[#64748B] text-[11px] mt-0.5">
                    Menyertakan uraian langkah solusi di lembar cetak PDF untuk bahan review.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="w-1/2 rounded-2xl"
                onClick={() => setIsPdfModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                className="w-1/2 rounded-2xl"
                isLoading={isGeneratingPdf}
                onClick={handleDownloadPdf}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Unduh PDF
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Question Modal */}
      {reportingQuestionId && (
        <ReportQuestionModal
          questionId={reportingQuestionId}
          isOpen={!!reportingQuestionId}
          onClose={() => setReportingQuestionId(null)}
        />
      )}
    </div>
  );
}
