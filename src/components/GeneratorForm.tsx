"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Subject, Topic } from "@/types/subject";
import { PracticeMode } from "@/types/question";
import { User } from "@/types/user";
import {
  Sparkles,
  Layers,
  Brain,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Flame,
  ArrowRight,
  Clock,
  X,
  Ban,
  Cpu,
  UploadCloud,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calculator,
  Atom,
  Dna,
  Globe,
  Coins,
  Users,
  Languages,
  Zap,
  HelpCircle,
  PlayCircle,
  ShieldCheck,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { toast } from "@/lib/design-system/toast";
import { cn } from "@/lib/utils";

export const GeneratorForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Form State: 1. Pembelajaran
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("SMA");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [customSubtopic, setCustomSubtopic] = useState<string>("");

  // Form State: 2. Konfigurasi
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [mode, setMode] = useState<PracticeMode>("reguler");
  const [learningMode, setLearningMode] = useState<"belajar" | "ujian">("belajar");

  // Form State: 3. Sumber Soal & Referensi
  const [sourceType, setSourceType] = useState<"ai" | "curated_bank" | "document_upload">("ai");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [documentNotes, setDocumentNotes] = useState<string>("");

  // Form State: 4. Pengaturan Lanjutan (Progressive Disclosure)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [customInstruction, setCustomInstruction] = useState("");

  // Flow State
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canFallback, setCanFallback] = useState(false);
  const [aiInfo, setAiInfo] = useState<{ provider: string; model?: string; hasKey?: boolean } | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{
    hasAiAccess: boolean;
    isOwner: boolean;
    dailyQuota: number;
    usedToday: number;
    reservedToday: number;
    remainingToday: number;
    quotaDate: string;
    resetTimeIso: string;
    rateLimitRpm: number;
    maxQuestionsPerRequest: number;
    emergencyShutdown: boolean;
    enabled: boolean;
  } | null>(null);

  const refreshQuota = () => {
    fetch("/api/ai/quota-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.quota) setQuotaInfo(data.quota);
      })
      .catch(() => {});
  };

  // Progressive Generation State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [progressStage, setProgressStage] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUserCancelledRef = useRef<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard accessibility: dismiss summary modal on Escape key
  useEffect(() => {
    if (!isSummaryModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isGenerating) {
        setIsSummaryModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSummaryModalOpen, isGenerating]);

  // Initial Fetch & URL query params sync
  useEffect(() => {
    const urlSubject = searchParams.get("subject");

    Promise.all([
      fetch("/api/subjects").then((res) => res.json()),
      fetch("/api/generator").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/auth/me").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([subData, aiData, authData]) => {
        if (subData?.subjects && subData.subjects.length > 0) {
          setSubjects(subData.subjects);

          // Jika ada query ?subject= di URL, gunakan itu
          const matchedSubject = urlSubject
            ? subData.subjects.find((s: Subject) => s.id === urlSubject || s.id.toLowerCase() === urlSubject.toLowerCase())
            : null;

          const activeSub = matchedSubject || subData.subjects[0];
          setSelectedSubjectId(activeSub.id);
          if (activeSub.topics && activeSub.topics.length > 0) {
            setSelectedTopicId(activeSub.topics[0].id);
          }
        }
        if (aiData) {
          setAiInfo({
            provider: aiData.provider,
            model: aiData.model,
            hasKey: aiData.hasKey,
          });
          if (aiData.quota) {
            setQuotaInfo(aiData.quota);
          }
        }
        if (authData?.user) {
          setCurrentUser(authData.user);
        }
      })
      .catch(() => {
        setErrorMessage("Gagal memuat kurikulum materi SMA.");
      })
      .finally(() => setLoadingSubjects(false));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [searchParams]);

  // Real-time progress updates during generation
  useEffect(() => {
    if (!isGenerating) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedSeconds(0);
      setProgressStage("");
      return;
    }

    setElapsedSeconds(0);
    setProgressStage("Menginisialisasi konfigurasi kurikulum SMA...");

    const totalBatches = Math.ceil(questionCount / 5);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next < 3) {
          setProgressStage("Menghubungi AI engine & memproses silabus kurikulum SMA...");
        } else if (next < 8) {
          setProgressStage(
            totalBatches > 1
              ? `Menyusun butir soal batch 1 dari ${totalBatches}...`
              : "Menyusun opsi jawaban A–E dan rumus KaTeX..."
          );
        } else if (next < 16) {
          setProgressStage(
            totalBatches > 1
              ? `Memproses batch selanjutnya & memeriksa rumus KaTeX...`
              : "Memvalidasi anti-bocor petunjuk & konsistensi kurikulum..."
          );
        } else if (next < 24) {
          setProgressStage("Memvalidasi kualitas soal & kunci jawaban...");
        } else {
          setProgressStage("Menyimpan ke basis data & menyiapkan ruang latihan...");
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGenerating, questionCount]);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const currentTopic = currentSubject?.topics.find((t) => t.id === selectedTopicId);

  // Subject icon helper
  const getSubjectIcon = (subjectId: string) => {
    switch (subjectId.toLowerCase()) {
      case "matematika":
        return <Calculator className="w-5 h-5 text-[#15803D]" />;
      case "fisika":
        return <Atom className="w-5 h-5 text-[#0369A1]" />;
      case "kimia":
        return <Sparkles className="w-5 h-5 text-[#C2410C]" />;
      case "biologi":
        return <Dna className="w-5 h-5 text-[#15803D]" />;
      case "ekonomi":
        return <Coins className="w-5 h-5 text-[#B45309]" />;
      case "sosiologi":
        return <Users className="w-5 h-5 text-[#7C3AED]" />;
      case "geografi":
        return <Globe className="w-5 h-5 text-[#0D9488]" />;
      case "bahasa-indonesia":
        return <BookOpen className="w-5 h-5 text-[#DC2626]" />;
      case "bahasa-inggris":
        return <Languages className="w-5 h-5 text-[#2563EB]" />;
      default:
        return <BookOpen className="w-5 h-5 text-[#16A34A]" />;
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    const sub = subjects.find((s) => s.id === subjectId);
    if (sub && sub.topics.length > 0) {
      setSelectedTopicId(sub.topics[0].id);
      setCustomSubtopic("");
    } else {
      setSelectedTopicId("");
      setCustomSubtopic("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file melebihi batas maksimal 10MB.");
        return;
      }
      setUploadedFileName(file.name);
      setUploadedFileSize((file.size / 1024).toFixed(1) + " KB");
      toast.success(`Dokumen "${file.name}" berhasil dilampirkan.`);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFileName(null);
    setUploadedFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;
    setErrorMessage(null);

    if (!selectedSubjectId) {
      setErrorMessage("Silakan pilih mata pelajaran.");
      toast.error("Silakan pilih mata pelajaran.");
      return;
    }
    if (!selectedTopicId) {
      setErrorMessage("Silakan pilih materi pokok.");
      toast.error("Silakan pilih materi pokok.");
      return;
    }
    if (questionCount < 1 || questionCount > 30) {
      setErrorMessage("Jumlah butir soal harus berada di antara 1 sampai 30 butir.");
      toast.error("Jumlah butir soal harus antara 1 - 30 butir.");
      return;
    }

    // AI Quota & Permission Validation (Task 3)
    if (sourceType === "ai" && quotaInfo) {
      if (quotaInfo.emergencyShutdown) {
        setErrorMessage("Mode Darurat AI Aktif: Generator AI sedang dinonaktifkan sementara oleh Owner. Anda dapat beralih ke Bank Soal SMA.");
        toast.error("Generator AI dinonaktifkan dalam mode darurat.");
        setCanFallback(true);
        return;
      }
      if (!quotaInfo.hasAiAccess && !quotaInfo.isOwner) {
        setErrorMessage("Akses AI Belum Diaktifkan: Akun Anda belum memiliki izin akses Generator AI dari Owner. Silakan pilih sumber Bank Soal Terkurasi SMA.");
        toast.warning("Akun belum memiliki izin akses AI.");
        setCanFallback(true);
        return;
      }
      if (quotaInfo.remainingToday === 0) {
        setErrorMessage(`Kuota AI Harian Habis: Anda telah menggunakan kuota (${quotaInfo.usedToday}/${quotaInfo.dailyQuota}). Reset pukul 00:00 WIB. Anda dapat menggunakan Bank Soal SMA.`);
        toast.warning("Kuota harian AI Anda telah habis.");
        setCanFallback(true);
        return;
      }
    }

    setIsSummaryModalOpen(true);
  };

  const handleCancelGeneration = () => {
    isUserCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setIsSummaryModalOpen(false);
    setErrorMessage("Pembuatan soal dibatalkan oleh pengguna.");
    setCanFallback(false);
    toast.info("Pembuatan soal dibatalkan.");
  };

  const handleGenerateSession = async (useFallback: boolean = false) => {
    if (isGenerating) return;
    isUserCancelledRef.current = false;
    setIsGenerating(true);
    setErrorMessage(null);
    if (!useFallback) setCanFallback(false);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Timeout: 30s base + 4.5s per question
    const clientTimeout = Math.max(55000, 30000 + Number(questionCount) * 4500);
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, clientTimeout);

    try {
      const isManual = sourceType === "curated_bank" || useFallback;

      const res = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          topicId: selectedTopicId,
          subtopic: customSubtopic.trim() || undefined,
          questionCount: Number(questionCount),
          mode,
          learningMode,
          fallbackToManual: isManual,
          // Extra context fields
          grade: selectedGrade,
          notes: documentNotes.trim() || customInstruction.trim() || undefined,
          hasUploadedDoc: Boolean(uploadedFileName),
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        if (data?.canFallbackToManual) {
          setCanFallback(true);
        }
        refreshQuota();

        let friendlyMessage = data?.error || "Pembuatan soal gagal, silakan coba lagi.";
        if (data?.code === "UNAUTHORIZED_AI_ACCESS") {
          friendlyMessage = data.error || "Akun Anda belum memiliki izin akses Generator AI dari Owner.";
          setCanFallback(true);
        } else if (data?.code === "USER_QUOTA_EXHAUSTED") {
          friendlyMessage = data.error || "Kuota AI harian Anda telah habis. Reset otomatis pukul 00:00 WIB.";
          setCanFallback(true);
        } else if (data?.code === "GLOBAL_QUOTA_EXHAUSTED") {
          friendlyMessage = data.error || "Kuota harian global platform telah tercapai. Reset pukul 00:00 WIB.";
          setCanFallback(true);
        } else if (data?.code === "EMERGENCY_SHUTDOWN") {
          friendlyMessage = data.error || "Generator AI sedang dinonaktifkan sementara dalam mode darurat.";
          setCanFallback(true);
        } else if (data?.code === "RATE_LIMIT_EXCEEDED") {
          friendlyMessage = data.error || "Batas frekuensi permintaan terlampaui. Silakan tunggu sebentar.";
        } else if (data?.code === "EXCEEDS_MAX_QUESTIONS") {
          friendlyMessage = data.error || "Jumlah butir soal melebihi batas maksimum per permintaan.";
        } else if (data?.errorCode === "INVALID_KEY") {
          friendlyMessage = "API Key AI belum valid atau belum diaktifkan. Silakan periksa di Pengaturan AI.";
        } else if (data?.errorCode === "QUOTA_EXHAUSTED") {
          friendlyMessage = "Kuota API AI telah habis atau terkena pembatasan laju (Rate Limit). Anda dapat menggunakan Bank Soal kurikulum SMA.";
        } else if (data?.errorCode === "MODEL_NOT_FOUND") {
          friendlyMessage = "Model AI yang dipilih tidak tersedia untuk konfigurasi ini. Silakan sesuaikan model di Pengaturan AI.";
        } else if (data?.errorCode === "TIMEOUT") {
          friendlyMessage = "Server AI memerlukan waktu respon lebih lama dari batas wajar. Coba kurangi jumlah soal atau gunakan Bank Soal kurikulum SMA.";
        } else if (data?.errorCode === "INVALID_FORMAT") {
          friendlyMessage = "Format soal dari AI tidak memenuhi standar validasi kurikulum SMA. Silakan coba generate ulang.";
        } else if (data?.errorCode === "NETWORK_ERROR") {
          friendlyMessage = "Gagal terhubung ke server provider AI. Periksa koneksi internet Anda.";
        }

        throw new Error(friendlyMessage);
      }

      refreshQuota();
      toast.success("Sesi latihan berhasil disiapkan!");
      setIsSummaryModalOpen(false);
      router.push(`/practice/${data.sessionId}`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setIsSummaryModalOpen(false);

      if (isUserCancelledRef.current) {
        setErrorMessage("Pembuatan soal dibatalkan oleh pengguna.");
        setCanFallback(false);
      } else if (err.name === "AbortError") {
        setErrorMessage(
          "Koneksi ke server terputus atau melebihi batas waktu (timeout). Anda dapat mencoba lagi atau menggunakan Bank Soal kurikulum SMA."
        );
        setCanFallback(true);
      } else {
        setErrorMessage(err.message || "Pembuatan soal gagal, silakan coba lagi.");
      }
      toast.error(err.message || "Gagal membuat sesi latihan.");
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  if (loadingSubjects) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-[#64748B] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
        <p className="text-xs font-semibold">Memuat silabus Kurikulum Merdeka SMA & daftar materi...</p>
      </div>
    );
  }

  // Estimasi waktu pengerjaan: 1.5 - 2 menit per butir soal
  const estimatedMinutes = Math.round(questionCount * (mode === "hots" ? 2.5 : 1.8));

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Engine & AI System Status Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center shrink-0 border border-[#BBF7D0]">
            <Cpu className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#0F172A]">Mesin Sintesis:</span>
              {sourceType === "curated_bank" ? (
                <Badge variant="green" size="sm" dot>
                  Bank Soal Terkurasi (Kurikulum SMA)
                </Badge>
              ) : aiInfo?.provider === "gemini" ? (
                <Badge variant="green" size="sm" dot>
                  Google Gemini ({aiInfo.model || "gemini-2.5-flash"})
                </Badge>
              ) : aiInfo?.provider === "openai" ? (
                <Badge variant="green" size="sm" dot>
                  OpenAI ({aiInfo.model || "gpt-4o-mini"})
                </Badge>
              ) : (
                <Badge variant="charcoal" size="sm" dot>
                  Bank Soal Terkurasi SMA
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {sourceType === "curated_bank"
                ? "Mode bank soal kurikulum SMA terkalibrasi tanpa konsumsi token eksternal"
                : aiInfo?.hasKey
                ? "Mesin aktif — butir soal disintesis dan divalidasi langsung sesuai standar nasional"
                : "Menunggu konfigurasi kunci API oleh Administrator"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {sourceType === "ai" && quotaInfo && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                quotaInfo.emergencyShutdown
                  ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                  : !quotaInfo.hasAiAccess
                  ? "bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]"
                  : quotaInfo.remainingToday === 0
                  ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]"
                  : "bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {quotaInfo.emergencyShutdown
                ? "Mode Darurat AI Aktif"
                : !quotaInfo.hasAiAccess
                ? "Akses AI Belum Diizinkan"
                : `Sisa Kuota: ${quotaInfo.remainingToday} / ${quotaInfo.dailyQuota} (Reset 00:00 WIB)`}
            </div>
          )}

          {currentUser && (currentUser.role === "admin" || currentUser.role === "owner") && (
            <button
              type="button"
              onClick={() => router.push("/admin/ai-settings")}
              className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D] hover:underline px-2 py-1 flex items-center gap-1 shrink-0"
            >
              Pengaturan AI &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Quota Access Status Alerts */}
      {sourceType === "ai" && quotaInfo?.emergencyShutdown && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border-2 border-[#DC2626] text-[#991B1B] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#DC2626] mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm text-[#DC2626]">Emergency AI Shutdown Sedang Berlangsung</p>
            <p className="leading-relaxed">
              Seluruh akses pembuatan soal via AI saat ini dihentikan sementara oleh Owner platform demi pemeliharaan darurat. Anda dapat mengganti Sumber Soal ke <strong>Bank Soal Kurikulum SMA</strong> untuk tetap berlatih secara offline.
            </p>
          </div>
        </div>
      )}

      {sourceType === "ai" && !quotaInfo?.emergencyShutdown && quotaInfo && !quotaInfo.hasAiAccess && !quotaInfo.isOwner && (
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#D97706] mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm text-[#B45309]">Akses AI Membutuhkan Izin Owner</p>
            <p className="leading-relaxed">
              Akun Anda belum memiliki izin akses Generator AI NemoLearn. Silakan hubungi Owner platform untuk mengaktifkan izin akun Anda, atau pilih opsi <strong>Bank Soal Kurikulum SMA Terkurasi</strong> di bagian Sumber Soal.
            </p>
          </div>
        </div>
      )}

      {sourceType === "ai" && !quotaInfo?.emergencyShutdown && quotaInfo?.hasAiAccess && quotaInfo.remainingToday === 0 && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#DC2626] mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm">Kuota AI Harian Anda Telah Habis</p>
            <p className="leading-relaxed">
              Anda telah menggunakan seluruh {quotaInfo.dailyQuota} kuota generasi AI untuk hari ini. Kuota akan otomatis direset kembali pada pukul <strong>00:00 WIB (Asia/Jakarta)</strong>. Anda tetap dapat melanjutkan latihan dengan memilih <strong>Bank Soal Kurikulum SMA</strong>.
            </p>
          </div>
        </div>
      )}

      {/* 2. Error Notification & Fallback Banner */}
      {errorMessage && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] space-y-3 animate-scale-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#DC2626] mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm">Pembuatan Soal Terkendala</p>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>

          {canFallback && (
            <div className="pt-3 border-t border-[#FECACA] flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-[#991B1B]">
                Ingin tetap melanjutkan latihan sekarang menggunakan Bank Soal kurikulum SMA?
              </p>
              <Button
                variant="primary"
                size="sm"
                disabled={isGenerating}
                onClick={() => handleGenerateSession(true)}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Gunakan Bank Soal SMA
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 3. Main Form & Live Preview Layout (Asymmetrical 2-Column as in Image 1 CoolQuiz) */}
      <form onSubmit={handleOpenSummary} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Kolom Kiri: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* GROUP A: Informasi Pembelajaran */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#0F172A]">
                  <Layers className="w-4 h-4 text-[#16A34A]" />
                  A. Informasi Pembelajaran <span className="text-[#DC2626]">*</span>
                </CardTitle>
                <Badge variant="green" size="xs">
                  Wajib Diisi
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Jenjang Kelas Filter Pills */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Jenjang / Target Kelas SMA:
                </label>
                <div className="flex flex-wrap gap-2">
                  {["SMA", "Kelas 10", "Kelas 11", "Kelas 12"].map((grade) => (
                    <button
                      type="button"
                      key={grade}
                      onClick={() => setSelectedGrade(grade)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                        selectedGrade === grade
                          ? "bg-[#16A34A] text-white shadow-xs"
                          : "bg-[#FAF9F5] text-[#334155] border border-[#E5E7EB] hover:border-[#16A34A]"
                      )}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Selection Tiles (Inspirasi Image 2) */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-2">
                  Pilih Mata Pelajaran:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {subjects.map((sub) => {
                    const isSelected = sub.id === selectedSubjectId;
                    return (
                      <button
                        type="button"
                        key={sub.id}
                        onClick={() => handleSubjectChange(sub.id)}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[76px] cursor-pointer group",
                          isSelected
                            ? "bg-[#F0FDF4] border-[#16A34A] ring-1 ring-[#16A34A] shadow-xs"
                            : "bg-[#FAF9F5] border-[#E5E7EB] hover:border-[#CBD5E1] hover:bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="p-1 rounded-lg bg-white border border-[#E5E7EB] group-hover:scale-105 transition-transform">
                            {getSubjectIcon(sub.id)}
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#0F172A] leading-tight">
                            {sub.name}
                          </p>
                          <p className="text-[10px] text-[#64748B] mt-0.5">
                            {sub.topics.length} materi pokok
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Select */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Materi Pokok Kurikulum:
                </label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => {
                    setSelectedTopicId(e.target.value);
                    setCustomSubtopic("");
                  }}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#0F172A] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:border-[#16A34A] transition-colors"
                >
                  {currentSubject?.topics.map((top) => (
                    <option key={top.id} value={top.id}>
                      {top.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subtopic Quick Chips */}
              {currentTopic && currentTopic.subtopics.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                    Submateri Cepat (Opsional):
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {currentTopic.subtopics.map((subt) => {
                      const isPicked = customSubtopic === subt;
                      return (
                        <button
                          type="button"
                          key={subt}
                          onClick={() => setCustomSubtopic(isPicked ? "" : subt)}
                          className={cn(
                            "text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer",
                            isPicked
                              ? "bg-[#F0FDF4] border-[#16A34A] text-[#15803D] font-bold"
                              : "bg-[#FAF9F5] border-[#E5E7EB] text-[#334155] hover:border-[#16A34A]"
                          )}
                        >
                          {subt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Subtopic Text */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Fokus Submateri Spesifik (Bisa diketik manual):
                </label>
                <Input
                  placeholder="Contoh: Hukum Newton II / Pesawat Atwood / Pembiasan Lensa..."
                  value={customSubtopic}
                  onChange={(e) => setCustomSubtopic(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* GROUP B: Konfigurasi Soal */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#0F172A]">
                  <Sliders className="w-4 h-4 text-[#16A34A]" />
                  B. Konfigurasi Latihan Soal <span className="text-[#DC2626]">*</span>
                </CardTitle>
                <span className="font-mono text-xs font-bold text-[#16A34A]">
                  {questionCount} Butir Soal
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Question Count Presets & Slider */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20, 25, 30].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setQuestionCount(preset)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer",
                        questionCount === preset
                          ? "bg-[#16A34A] text-white shadow-xs"
                          : "bg-[#FAF9F5] text-[#334155] border border-[#E5E7EB] hover:border-[#16A34A]"
                      )}
                    >
                      {preset} Soal
                    </button>
                  ))}
                </div>

                <div className="space-y-1 pt-1">
                  <input
                    type="range"
                    min={1}
                    max={30}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full accent-[#16A34A] h-2 bg-[#E5E7EB] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#64748B] font-mono">
                    <span>1 (Kuis Kilat)</span>
                    <span>10 (Rekomendasi)</span>
                    <span>20 (Tryout)</span>
                    <span>30 (Maksimal)</span>
                  </div>
                </div>
              </div>

              {/* Practice Mode Options (Reguler vs HOTS) */}
              <div className="pt-3 border-t border-[#F3F4EE]">
                <label className="block text-xs font-semibold text-[#334155] mb-2">
                  Pilihan Mode Latihan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMode("reguler")}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all cursor-pointer",
                      mode === "reguler"
                        ? "bg-[#F0FDF4] border-[#16A34A] ring-1 ring-[#16A34A] shadow-xs"
                        : "bg-white border-[#E5E7EB] hover:border-[#CBD5E1]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs sm:text-sm text-[#0F172A]">Mode Reguler</span>
                      {mode === "reguler" && <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Penguasaan konsep terstruktur, rumus dasar, dan latihan bertahap silabus SMA.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("hots")}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all cursor-pointer",
                      mode === "hots"
                        ? "bg-[#FFF7ED] border-[#EA580C] ring-1 ring-[#EA580C] shadow-xs"
                        : "bg-white border-[#E5E7EB] hover:border-[#CBD5E1]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs sm:text-sm flex items-center gap-1.5 text-[#EA580C]">
                        <Flame className="w-4 h-4 text-[#EA580C]" /> Mode HOTS
                      </span>
                      {mode === "hots" && <CheckCircle2 className="w-4 h-4 text-[#EA580C]" />}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Higher Order Thinking Skills: Analisis mendalam, studi kasus, dan standar seleksi UTBK.
                    </p>
                  </button>
                </div>
              </div>

              {/* Learning Flow Mode (Mode Belajar vs Mode Ujian) */}
              <div className="pt-3 border-t border-[#F3F4EE]">
                <label className="block text-xs font-semibold text-[#334155] mb-2">
                  Alur Pengerjaan & Pembahasan (Dua Mode Latihan):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLearningMode("belajar")}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all cursor-pointer",
                      learningMode === "belajar"
                        ? "bg-[#F0FDF4] border-[#16A34A] ring-1 ring-[#16A34A] shadow-xs"
                        : "bg-white border-[#E5E7EB] hover:border-[#CBD5E1]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs sm:text-sm text-[#0F172A] flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#16A34A]" /> Mode Belajar
                      </span>
                      {learningMode === "belajar" && <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Evaluasi instan per butir soal: Cek benar/salah langsung dan telaah pembahasan interaktif sebelum melangkah ke soal berikutnya.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLearningMode("ujian")}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all cursor-pointer",
                      learningMode === "ujian"
                        ? "bg-[#F8FAFC] border-[#4F46E5] ring-1 ring-[#4F46E5] shadow-xs"
                        : "bg-white border-[#E5E7EB] hover:border-[#CBD5E1]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs sm:text-sm text-[#0F172A] flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#4F46E5]" /> Mode Ujian
                      </span>
                      {learningMode === "ujian" && <CheckCircle2 className="w-4 h-4 text-[#4F46E5]" />}
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      Simulasi ujian baku: Kerjakan seluruh soal tanpa bocoran kunci. Hasil akhir, skor IRT, dan pembahasan menyeluruh dibuka setelah ujian diserahkan.
                    </p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GROUP C: Sumber Soal & Referensi Modul */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#0F172A]">
                <Brain className="w-4 h-4 text-[#16A34A]" />
                C. Sumber Soal & Modul Pendukung
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Source Type Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: "ai",
                    label: "AI Synthesis",
                    desc: "Dibuat otomatis oleh AI",
                    icon: <Sparkles className="w-4 h-4 text-[#16A34A]" />,
                  },
                  {
                    id: "curated_bank",
                    label: "Bank Soal SMA",
                    desc: "Terkurasi & Terkalibrasi",
                    icon: <Layers className="w-4 h-4 text-[#0369A1]" />,
                  },
                  {
                    id: "document_upload",
                    label: "Upload Modul",
                    desc: "Dari dokumen materi",
                    icon: <UploadCloud className="w-4 h-4 text-[#EA580C]" />,
                  },
                ].map((src) => {
                  const isPicked = sourceType === src.id;
                  return (
                    <button
                      type="button"
                      key={src.id}
                      onClick={() => setSourceType(src.id as any)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                        isPicked
                          ? "bg-[#F0FDF4] border-[#16A34A] ring-1 ring-[#16A34A]"
                          : "bg-white border-[#E5E7EB] hover:border-[#CBD5E1]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {src.icon}
                        {isPicked && <Check className="w-3.5 h-3.5 text-[#16A34A]" />}
                      </div>
                      <p className="font-bold text-xs text-[#0F172A]">{src.label}</p>
                      <p className="text-[10px] text-[#64748B] mt-0.5">{src.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Upload Dropzone (jika mode document_upload atau pendukung materi) */}
              {sourceType === "document_upload" && (
                <div className="space-y-3 pt-2 animate-fade-in">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {!uploadedFileName ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#CBD5E1] hover:border-[#16A34A] bg-[#FAF9F5] hover:bg-white rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mx-auto">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-[#0F172A]">
                        Klik untuk unggah modul materi atau drag-and-drop
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Mendukung PDF, DOCX, atau TXT (Maks. 10MB)
                      </p>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-[#16A34A] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#0F172A] truncate">
                            {uploadedFileName}
                          </p>
                          <p className="text-[10px] text-[#64748B]">{uploadedFileSize}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-[#DC2626] hover:bg-[#FEF2F2] p-1.5 rounded-lg transition-colors"
                        title="Hapus file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <Textarea
                    placeholder="Catatan tambahan dari modul (misal: fokus ke rumus halaman 12...)"
                    value={documentNotes}
                    onChange={(e) => setDocumentNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* GROUP D: Pengaturan Tambahan (Progressive Disclosure) */}
          <div className="border border-[#E5E7EB] rounded-2xl bg-white overflow-hidden shadow-card">
            <button
              type="button"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF9F5] transition-colors"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#64748B]" />
                <span className="text-xs font-bold text-[#0F172A]">
                  Pengaturan Lanjutan & Format Pembahasan
                </span>
                <span className="text-[10px] text-[#64748B] bg-[#F3F4EE] px-2 py-0.5 rounded-full">
                  Opsional
                </span>
              </div>
              {showAdvancedSettings ? (
                <ChevronUp className="w-4 h-4 text-[#64748B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#64748B]" />
              )}
            </button>

            {showAdvancedSettings && (
              <div className="p-4 pt-0 border-t border-[#F3F4EE] space-y-4 animate-fade-in">
                <div className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">
                      Buka Pembahasan Konsep Lengkap
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      Tampilkan langkah demi langkah pemecahan masalah setelah kuis tuntas
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeExplanations}
                    onChange={(e) => setIncludeExplanations(e.target.checked)}
                    className="w-4 h-4 accent-[#16A34A] rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                    Instruksi Khusus untuk Pembuat Soal:
                  </label>
                  <Input
                    placeholder="Misal: Perbanyak soal bertipe grafik atau analogi fisika..."
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F5] border border-[#E5E7EB] text-[11px] text-[#64748B] space-y-1">
                  <p className="font-semibold text-[#0F172A]">Format Butir Soal Baku:</p>
                  <p>&bull; 5 Opsi Pilihan Ganda (A, B, C, D, E) standar UTBK & SNBT.</p>
                  <p>&bull; Rumus matematika & sains diformat menggunakan notasi KaTeX presisi.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Live Quiz Preview Mockup (5 cols - Inspirasi Image 1 CoolQuiz) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <Card className="border border-[#E5E7EB] shadow-card bg-white overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#F0FDF4] to-[#FAF9F5] border-b border-[#E5E7EB] pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="ui-label text-[#16A34A]">Live Preview</span>
                  <CardTitle className="text-base font-bold text-[#0F172A]">
                    Ringkasan Latihan Kuis
                  </CardTitle>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#BBF7D0] text-xs font-mono font-bold text-[#15803D]">
                  <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>&plusmn; {estimatedMinutes} Menit</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Phone Mockup Screen (Inspirasi Image 1) */}
              <div className="rounded-2xl border border-[#CBD5E1] bg-[#FAF9F5] p-4 shadow-inner space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                  </div>
                  <Badge variant={mode === "hots" ? "coral" : "green"} size="xs">
                    {mode.toUpperCase()} MODE
                  </Badge>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">
                    {currentSubject?.name || "Mata Pelajaran"} &bull; {selectedGrade}
                  </span>
                  <h4 className="font-bold text-sm text-[#0F172A] leading-snug">
                    {currentTopic?.name || "Materi Pokok"}
                  </h4>
                  {customSubtopic && (
                    <p className="text-[11px] text-[#64748B] font-medium">
                      Subtopik: {customSubtopic}
                    </p>
                  )}
                </div>

                {/* Sample Question Mockup */}
                <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>Soal 1 dari {questionCount}</span>
                    <span className="font-mono text-[#16A34A]">Poin 10</span>
                  </div>
                  <p className="text-xs text-[#0F172A] font-medium leading-relaxed">
                    Perhatikan konsep dasar mengenai {currentTopic?.name || "materi ini"}. Manakah pernyataan berikut yang paling tepat sesuai kaidah ilmiah?
                  </p>
                  <div className="space-y-1 pt-1">
                    {["A", "B", "C", "D", "E"].map((opt) => (
                      <div
                        key={opt}
                        className="px-2.5 py-1 rounded-md bg-[#FAF9F5] border border-[#E5E7EB] text-[10px] text-[#334155] flex items-center gap-2"
                      >
                        <span className="font-bold text-[#16A34A]">{opt}.</span>
                        <span className="truncate">Opsi analisis konsep dan penalaran terstruktur...</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meta details list */}
                <div className="pt-2 text-[11px] text-[#64748B] space-y-1">
                  <div className="flex justify-between">
                    <span>Jumlah Soal:</span>
                    <span className="font-bold text-[#0F172A]">{questionCount} Butir</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sumber Soal:</span>
                    <span className="font-medium text-[#0F172A]">
                      {sourceType === "ai"
                        ? "AI Synthesis Engine"
                        : sourceType === "curated_bank"
                        ? "Bank Soal SMA"
                        : "Modul Dokumen"}
                    </span>
                  </div>
                  {uploadedFileName && (
                    <div className="flex justify-between">
                      <span>Dokumen Terlampir:</span>
                      <span className="font-medium text-[#16A34A] truncate max-w-[150px]">
                        {uploadedFileName}
                      </span>
                    </div>
                  )}
                  {sourceType === "ai" && quotaInfo && (
                    <div className="flex justify-between pt-1 border-t border-[#E5E7EB]">
                      <span>Sisa Kuota AI:</span>
                      <span
                        className={`font-bold ${
                          quotaInfo.remainingToday === 0 ? "text-[#DC2626]" : "text-[#16A34A]"
                        }`}
                      >
                        {quotaInfo.hasAiAccess
                          ? `${quotaInfo.remainingToday} / ${quotaInfo.dailyQuota} (Reset 00:00 WIB)`
                          : "Belum Diizinkan"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit CTA Button */}
              <Button
                type="submit"
                variant="coral"
                size="lg"
                disabled={isGenerating}
                className="w-full py-4 text-base font-bold shadow-md active:scale-95 transition-transform"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Mulai Sesi Latihan
              </Button>

              <p className="text-[11px] text-center text-[#64748B]">
                Soal divalidasi langsung & kunci jawaban aman tersimpan hingga evaluasi akhir.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* 4. Active Informative Generation & Confirmation Modal */}
      {isSummaryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => !isGenerating && setIsSummaryModalOpen(false)}
        >
          <div
            className="bg-white border border-[#E5E7EB] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {!isGenerating ? (
              <>
                <div className="flex items-center justify-between border-b border-[#F3F4EE] pb-3">
                  <div className="flex items-center gap-2 text-[#0F172A] font-bold text-base sm:text-lg">
                    <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                    Konfirmasi Paket Latihan
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSummaryModalOpen(false)}
                    className="p-1 text-[#64748B] hover:text-[#0F172A] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2.5 bg-[#FAF9F5] p-4 rounded-2xl border border-[#E5E7EB] text-xs">
                  <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                    <span className="text-[#64748B]">Mata Pelajaran:</span>
                    <span className="font-bold text-[#0F172A]">{currentSubject?.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                    <span className="text-[#64748B]">Target Jenjang:</span>
                    <span className="font-bold text-[#0F172A]">{selectedGrade}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                    <span className="text-[#64748B]">Materi Pokok:</span>
                    <span className="font-bold text-[#0F172A]">{currentTopic?.name}</span>
                  </div>
                  {customSubtopic && (
                    <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                      <span className="text-[#64748B]">Fokus Submateri:</span>
                      <span className="font-semibold text-[#16A34A]">{customSubtopic}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                    <span className="text-[#64748B]">Jumlah Butir Soal:</span>
                    <span className="font-mono font-bold text-[#0F172A]">{questionCount} Butir</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                    <span className="text-[#64748B]">Karakter Soal:</span>
                    <Badge variant={mode === "hots" ? "coral" : "green"} size="sm">
                      {mode.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#64748B]">Alur Pengerjaan:</span>
                    <Badge variant={learningMode === "belajar" ? "green" : "outline"} size="sm">
                      {learningMode === "belajar" ? "MODE BELAJAR" : "MODE UJIAN"}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  {learningMode === "belajar"
                    ? "Mode Belajar: Anda akan menerima koreksi langsung dan pembahasan adaptif per butir soal seketika setelah menjawab."
                    : "Mode Ujian: Kunci jawaban disembunyikan selama ujian. Penilaian skor IRT dan pembahasan lengkap akan dibuka setelah ujian selesai."}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="w-1/2"
                    disabled={isGenerating}
                    onClick={() => setIsSummaryModalOpen(false)}
                  >
                    Ubah Pilihan
                  </Button>
                  <Button
                    variant="coral"
                    className="w-1/2"
                    disabled={isGenerating}
                    onClick={() => handleGenerateSession(false)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Mulai Kerjakan
                  </Button>
                </div>
              </>
            ) : (
              /* Informative Real-Time Progress View */
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] flex items-center justify-center mx-auto shadow-xs">
                  <Sparkles className="w-7 h-7 animate-pulse stroke-[2]" />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                    Sedang Menyusun Latihan Soal SMA
                  </h3>
                  <div className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 bg-[#FAF9F5] rounded-full border border-[#E5E7EB] text-xs font-mono text-[#64748B]">
                    <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
                    Waktu Berjalan: {elapsedSeconds} detik
                  </div>
                </div>

                <div className="space-y-2 max-w-sm mx-auto">
                  <div className="w-full bg-[#E5E7EB] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#16A34A] h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(95, 20 + elapsedSeconds * 5)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-[#16A34A] animate-fade-in min-h-[20px]">
                    {progressStage}
                  </p>
                </div>

                <p className="text-[11px] text-[#64748B] max-w-xs mx-auto leading-relaxed">
                  Setiap butir soal melewati verifikasi sintaks formula matematika KaTeX dan pencegahan kebocoran petunjuk.
                </p>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[#DC2626] border-[#FECACA] hover:bg-[#FEF2F2]"
                    onClick={handleCancelGeneration}
                    leftIcon={<Ban className="w-3.5 h-3.5" />}
                  >
                    Batalkan Proses
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
