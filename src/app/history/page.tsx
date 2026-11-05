"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PracticeSession } from "@/types/session";
import { formatIndonesianScore } from "@/lib/scoring/format";
import {
  History,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Filter,
  CheckCircle2,
  Search,
  Check,
  Award,
  Layers,
  BarChart3,
  Flame,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

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

export default function HistoryPage() {
  const [sessions, setSessions] = useState<
    (PracticeSession & { subjectName?: string; topicName?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "highest_score">("newest");

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sessions) {
          setSessions(data.sessions);
        }
      })
      .catch((err) => console.error("Gagal memuat riwayat latihan:", err))
      .finally(() => setLoading(false));
  }, []);

  // Compute real analytics summary from actual session history
  const summaryMetrics = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === "completed");
    const active = sessions.filter((s) => s.status === "active");

    const totalQuestionsAnswered = completed.reduce((acc, s) => {
      return acc + (s.correctCount ?? 0) + (s.wrongCount ?? 0);
    }, 0);

    // Calculate average score for completed sessions
    let avgScoreLabel = "—";
    if (completed.length > 0) {
      const percentageSessions = completed.filter((s) => s.scoringMethod !== "irt");
      if (percentageSessions.length > 0) {
        const sum = percentageSessions.reduce((acc, s) => acc + (s.score ?? 0), 0);
        const avg = sum / percentageSessions.length;
        avgScoreLabel = `${formatIndonesianScore(avg)}%`;
      } else {
        const sumIrt = completed.reduce((acc, s) => acc + (s.score ?? 0), 0);
        const avgIrt = sumIrt / completed.length;
        avgScoreLabel = formatIndonesianScore(avgIrt);
      }
    }

    return {
      total,
      completedCount: completed.length,
      activeCount: active.length,
      avgScoreLabel,
      totalQuestionsAnswered,
    };
  }, [sessions]);

  // Filter & Search logic
  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Search query filter (matches subject or topic name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.subjectName && s.subjectName.toLowerCase().includes(q)) ||
          (s.topicName && s.topicName.toLowerCase().includes(q))
      );
    }

    // Status / Mode filter
    if (filterMode === "completed") {
      result = result.filter((s) => s.status === "completed");
    } else if (filterMode === "active") {
      result = result.filter((s) => s.status === "active");
    } else if (filterMode === "hots") {
      result = result.filter((s) => s.config.mode === "hots");
    } else if (filterMode === "remedial") {
      result = result.filter((s) => s.config.isRemedial);
    }

    // Sorting
    if (sortBy === "highest_score") {
      result.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else {
      // Default: newest first
      result.sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
    }

    return result;
  }, [sessions, searchQuery, filterMode, sortBy]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-fade-in">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div className="space-y-1.5">
          <Badge variant="green" size="md">
            Rekam Jejak Belajar Mandiri
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Riwayat Sesi Latihan
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Pantau perkembangan pemahaman, riwayat nilai, dan evaluasi paket soal yang pernah Anda kerjakan.
          </p>
        </div>

        <Link href="/generator" className="self-start sm:self-auto">
          <Button variant="primary" size="md" leftIcon={<Sparkles className="w-4 h-4" />}>
            Mulai Latihan Baru
          </Button>
        </Link>
      </div>

      {/* 2. Quick Analytics Summary Strip (Real Data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Sesi */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-[#16A34A]" /> Total Sesi
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0F172A] mt-2 tabular-nums">
            {summaryMetrics.total}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            {summaryMetrics.activeCount > 0
              ? `${summaryMetrics.activeCount} sesi sedang berjalan`
              : "Semua sesi tersimpan"}
          </p>
        </div>

        {/* Sesi Diselesaikan */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Diselesaikan
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#16A34A] mt-2 tabular-nums">
            {summaryMetrics.completedCount}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Paket tuntas dievaluasi</p>
        </div>

        {/* Rata-rata Capaian */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-[#EA580C]" /> Rata-Rata Skor
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0F172A] mt-2 tabular-nums">
            {summaryMetrics.avgScoreLabel}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Dari sesi terselesaikan</p>
        </div>

        {/* Butir Soal Terjawab */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5 text-[#2563EB]" /> Soal Selesai
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0F172A] mt-2 tabular-nums">
            {summaryMetrics.totalQuestionsAnswered}
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Butir dikerjakan siswa</p>
        </div>
      </div>

      {/* 3. Search, Filter & Sort Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative grow">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata pelajaran atau nama materi..."
              className="w-full h-11 pl-10 pr-4 rounded-2xl border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 transition-all outline-hidden shadow-xs"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0 sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full h-11 px-3.5 rounded-2xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0F172A] focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 transition-all outline-hidden shadow-xs cursor-pointer"
            >
              <option value="newest">Waktu: Paling Baru</option>
              <option value="highest_score">Skor: Paling Tinggi</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#64748B] flex items-center gap-1.5 mr-1 font-semibold">
            <Filter className="w-3.5 h-3.5 text-[#16A34A]" /> Filter:
          </span>
          {[
            { key: "all", label: `Semua Sesi (${sessions.length})` },
            {
              key: "completed",
              label: `Sudah Selesai (${sessions.filter((s) => s.status === "completed").length})`,
            },
            {
              key: "active",
              label: `Sedang Berjalan (${sessions.filter((s) => s.status === "active").length})`,
            },
            {
              key: "hots",
              label: `Mode HOTS (${sessions.filter((s) => s.config.mode === "hots").length})`,
            },
            {
              key: "remedial",
              label: `Sesi Remedial (${sessions.filter((s) => s.config.isRemedial).length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterMode(tab.key)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                filterMode === tab.key
                  ? "bg-[#0F172A] text-white shadow-xs"
                  : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Session List */}
      {loading ? (
        <div className="p-16 text-center text-[#64748B] text-xs font-medium space-y-3 bg-white border border-[#E2E8F0] rounded-3xl">
          <div className="w-8 h-8 border-3 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-semibold text-[#0F172A]">Memuat riwayat sesi latihan...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-16 text-center space-y-4 bg-white border border-[#E2E8F0] rounded-3xl shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center mx-auto">
            <History className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Tidak Ada Sesi Latihan Ditemukan</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 leading-relaxed">
              {searchQuery
                ? `Tidak ada hasil yang sesuai dengan kata kunci "${searchQuery}". Coba kata kunci lain atau reset filter.`
                : "Mulai sesi latihan mandiri baru untuk merekam pencapaian dan mengasah pemahaman Anda."}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/generator">
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                Mulai Latihan Baru
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredSessions.map((s) => {
            const isCompleted = s.status === "completed";
            const targetUrl = isCompleted ? `/results/${s.id}` : `/practice/${s.id}`;
            const durationLabel = formatSessionDuration(s.startedAt, s.completedAt);

            return (
              <div
                key={s.id}
                className="bg-white border border-[#E2E8F0] hover:border-[#16A34A]/50 rounded-3xl p-5 sm:p-6 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs group"
              >
                {/* Left Information */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="green" size="sm">
                      {s.subjectName || "Mata Pelajaran"}
                    </Badge>
                    <span className="text-xs font-bold text-[#0F172A]">
                      {s.topicName || "Topik Materi"}
                    </span>

                    {s.config.mode === "hots" && (
                      <Badge variant="coral" size="xs">
                        HOTS
                      </Badge>
                    )}

                    {s.config.isRemedial && (
                      <Badge variant="lime" size="xs">
                        <RotateCcw className="w-3 h-3 mr-1" /> Remedial
                      </Badge>
                    )}
                  </div>

                  {/* Meta items: Date, Question count, Duration */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {new Date(s.startedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>&bull;</span>
                    <span>{s.questionIds?.length || 0} Butir Soal</span>
                    {durationLabel && (
                      <>
                        <span>&bull;</span>
                        <span className="text-[#16A34A] font-medium">{durationLabel}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Score & Actions */}
                <div className="flex items-center gap-5 justify-between sm:justify-end border-t sm:border-t-0 border-[#F1F5F9] pt-4 sm:pt-0">
                  {isCompleted ? (
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-extrabold font-mono text-[#0F172A] tabular-nums">
                        {s.scoreFormatted
                          ? s.scoreFormatted
                          : formatIndonesianScore(s.score ?? 0)}
                        {s.scoringMethod !== "irt" && "%"}
                      </p>
                      <p className="text-[11px] font-bold text-[#16A34A]">
                        {s.scoringMethod === "irt"
                          ? "Skor IRT 3-PL"
                          : `${s.correctCount ?? 0} dari ${s.questionIds?.length || 0} Benar`}
                      </p>
                    </div>
                  ) : (
                    <div className="text-left sm:text-right">
                      <Badge variant="amber" size="sm" pulseDot>
                        Sedang Berjalan
                      </Badge>
                      <p className="text-[10px] text-[#64748B] mt-0.5">Belum diserahkan</p>
                    </div>
                  )}

                  <Link href={targetUrl}>
                    <Button
                      variant={isCompleted ? "outline" : "primary"}
                      size="sm"
                      className="rounded-2xl"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {isCompleted ? "Buka Evaluasi" : "Lanjutkan"}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
