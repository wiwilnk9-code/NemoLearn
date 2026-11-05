"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { User } from "@/types/user";
import { PracticeSession } from "@/types/session";
import { formatIndonesianScore } from "@/lib/scoring/format";
import { MathRenderer } from "@/components/MathRenderer";
import {
  Sparkles,
  PlayCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  ShieldCheck,
  PlusCircle,
  Check,
  Compass,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton, SkeletonCard, SkeletonText } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<
    (PracticeSession & { subjectName?: string; topicName?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((res) => (res.ok ? res.json() : null)),
      fetch("/api/sessions").then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([userData, sessionData]) => {
        if (userData?.user) setCurrentUser(userData.user);
        if (sessionData?.sessions) setSessions(sessionData.sessions);
      })
      .catch((err) => console.error("Gagal memuat data beranda:", err))
      .finally(() => setLoading(false));
  }, []);

  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Banner Skeleton */}
        <div className="h-44 sm:h-52 bg-[#E5E7EB]/80 rounded-3xl animate-pulse" />
        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-card">
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-7 w-14 mb-2" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          ))}
        </div>
        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  // 1. Tampilan Pengunjung Belum Login
  if (!currentUser) {
    return <GuestLandingView />;
  }

  // 2. Tampilan Khusus Guru
  if (currentUser.role === "guru") {
    return (
      <TeacherDashboardView
        currentUser={currentUser}
        todayFormatted={todayFormatted}
        sessions={sessions}
      />
    );
  }

  // 3. Tampilan Utama Dashboard Siswa / Admin / Owner
  return (
    <StudentDashboardView
      currentUser={currentUser}
      todayFormatted={todayFormatted}
      sessions={sessions}
    />
  );
}

// =========================================================================
// 1. STUDENT DASHBOARD VIEW
// =========================================================================
function StudentDashboardView({
  currentUser,
  todayFormatted,
  sessions,
}: {
  currentUser: User;
  todayFormatted: string;
  sessions: (PracticeSession & { subjectName?: string; topicName?: string })[];
}) {
  const activeSession = sessions.find((s) => s.status === "active");
  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === "completed"),
    [sessions]
  );

  const totalCompleted = completedSessions.length;
  const totalQuestionsAnswered = completedSessions.reduce(
    (acc, s) => acc + (s.questionIds?.length || 0),
    0
  );

  const percentSessions = completedSessions.filter(
    (s) => s.scoringMethod !== "irt" && s.score !== null && s.score !== undefined
  );
  const irtSessions = completedSessions.filter(
    (s) => s.scoringMethod === "irt" && s.score !== null && s.score !== undefined
  );

  const isIrtOnly = irtSessions.length > 0 && percentSessions.length === 0;
  const avgScoreValue = isIrtOnly
    ? irtSessions.reduce((acc, s) => acc + (s.score || 0), 0) / irtSessions.length
    : percentSessions.length > 0
    ? percentSessions.reduce((acc, s) => acc + (s.score || 0), 0) / percentSessions.length
    : 0;

  const formattedAvgScore = totalCompleted > 0 ? formatIndonesianScore(avgScoreValue) : "0,00";
  const avgScoreUnit = isIrtOnly ? "" : "%";
  const avgScoreLabel = isIrtOnly ? "Rata-rata Skor IRT" : "Akurasi kumulatif";

  const learningStatus =
    totalCompleted >= 8
      ? "Siswa Teladan"
      : totalCompleted >= 4
      ? "Pelajar Aktif"
      : totalCompleted > 0
      ? "Konsisten Berlatih"
      : "Mulai Berlatih";

  // Hitung sesi yang diselesaikan 7 hari terakhir untuk weekly progress
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Mulai hari minggu / senin
  weekStart.setHours(0, 0, 0, 0);

  const completedThisWeek = completedSessions.filter((s) => {
    const sDate = new Date(s.startedAt);
    return sDate >= weekStart;
  }).length;

  // Pemetaan hari dalam 1 minggu untuk Weekly Progress Calendar
  const weekDays = useMemo(() => {
    const days = [
      { name: "Min", dayNum: 0 },
      { name: "Sen", dayNum: 1 },
      { name: "Sel", dayNum: 2 },
      { name: "Rab", dayNum: 3 },
      { name: "Kam", dayNum: 4 },
      { name: "Jum", dayNum: 5 },
      { name: "Sab", dayNum: 6 },
    ];
    const todayIndex = now.getDay();

    return days.map((d) => {
      const isToday = d.dayNum === todayIndex;
      // Periksa apakah ada sesi di hari tersebut
      const hasSession = completedSessions.some((s) => {
        const sDate = new Date(s.startedAt);
        return sDate.getDay() === d.dayNum;
      });

      return {
        ...d,
        isToday,
        hasSession,
      };
    });
  }, [completedSessions]);

  // Statistik Mata Pelajaran: hitung jumlah soal yang telah dikerjakan per mapel
  const subjectStats = useMemo(() => {
    const map: Record<string, { name: string; count: number; sessions: number }> = {};
    completedSessions.forEach((s) => {
      const subId = s.config.subjectId;
      const subName = s.subjectName || subId;
      if (!map[subId]) {
        map[subId] = { name: subName, count: 0, sessions: 0 };
      }
      map[subId].count += s.questionIds?.length || 0;
      map[subId].sessions += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [completedSessions]);

  // Daftar kurikulum SMA pilihan
  const curatedSubjects = [
    { id: "matematika", name: "Matematika", desc: "Aljabar, Trigonometri, Kalkulus", tag: "Wajib & Peminatan" },
    { id: "fisika", name: "Fisika", desc: "Kinematika, Termodinamika, Listrik", tag: "Saintek" },
    { id: "kimia", name: "Kimia", desc: "Stoikiometri, Larutan Asam-Basa", tag: "Saintek" },
    { id: "biologi", name: "Biologi", desc: "Biologi Sel, Genetika Mendel", tag: "Saintek" },
    { id: "ekonomi", name: "Ekonomi", desc: "Mekanisme Pasar & Akuntansi", tag: "Soshum" },
    { id: "sosiologi", name: "Sosiologi", desc: "Interaksi & Perubahan Sosial", tag: "Soshum" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Welcome Section (Inspirasi SkillUp & SIMBI) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#15803D] via-[#16A34A] to-[#14532D] p-6 sm:p-8 text-white shadow-md">
        {/* Decorative background circles */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-12 w-48 h-48 rounded-full bg-[#84CC16]/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="lime" size="sm" pulseDot dot>
                Kurikulum Merdeka SMA 2026
              </Badge>
              <span className="text-xs text-white/80 hidden sm:inline">&bull;</span>
              <span className="text-xs text-white/80 hidden sm:inline" suppressHydrationWarning>
                {todayFormatted}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Halo, {currentUser.displayName}! ✨
            </h1>

            <p className="text-xs sm:text-sm text-white/90 leading-relaxed max-w-xl">
              Siap menaklukkan tantangan belajar hari ini? Latihan terarah membantumu memahami konsep secara mendalam dan terukur.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/generator">
                <Button
                  variant="coral"
                  size="md"
                  leftIcon={<Sparkles className="w-4 h-4 stroke-[2.2]" />}
                >
                  Buat Latihan Baru
                </Button>
              </Link>
              <Link href="/bank-soal">
                <Button
                  variant="outline"
                  size="md"
                  className="bg-white/10 text-white hover:bg-white/20 border-white/25 hover:border-white"
                  leftIcon={<Layers className="w-4 h-4" />}
                >
                  Bank Soal SMA
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Streak Widget on Desktop */}
          <div className="hidden lg:flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 text-center min-w-[180px]">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-2 shadow-inner">
              <Flame className="w-7 h-7 text-[#FDE68A] animate-pulse" />
            </div>
            <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">
              Konsistensi Belajar
            </p>
            <p className="text-base font-bold text-white mt-0.5">
              {learningStatus}
            </p>
            <span className="text-[10px] text-white/70 mt-1">
              {totalCompleted} sesi diselesaikan
            </span>
          </div>
        </div>
      </section>

      {/* Admin / Owner Quick Access Banner */}
      {(currentUser.role === "admin" || currentUser.role === "owner") && (
        <section className="bg-[#052E16] border border-[#166534] rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <ShieldCheck className="w-5 h-5 text-[#86EFAC]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="lime" size="xs">
                  AKSES {currentUser.role.toUpperCase()}
                </Badge>
                <span className="text-xs text-white/70">Mode Pengelolaan Sistem</span>
              </div>
              <p className="font-bold text-sm text-white mt-0.5">
                Panel Kontrol Administrator & Mutu Soal NemoLearn
              </p>
            </div>
          </div>
          <Link href="/admin">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/15 text-white hover:bg-white/25 border-white/30"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Buka Panel Admin
            </Button>
          </Link>
        </section>
      )}

      {/* Active Session Notification Card (Jika ada sesi yang belum selesai) */}
      {activeSession && (
        <section className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shrink-0 shadow-xs">
              <PlayCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2410C]">
                  Sesi Sedang Berlangsung
                </span>
              </div>
              <h3 className="font-bold text-base text-[#0F172A]">
                {activeSession.subjectName} &bull; {activeSession.topicName}
              </h3>
              <p className="text-xs text-[#64748B]">
                {activeSession.questionIds?.length || 0} butir soal &bull; Mode:{" "}
                <span className="font-semibold uppercase text-[#0F172A]">
                  {activeSession.config?.mode || "Standard"}
                </span>
              </p>
            </div>
          </div>

          <Link href={`/practice/${activeSession.id}`} className="shrink-0">
            <Button variant="coral" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Lanjutkan Latihan
            </Button>
          </Link>
        </section>
      )}

      {/* 2. Learning Overview (4 KPI Cards yang terstruktur & bervariasi) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sesi */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-card hover:shadow-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="ui-label">Sesi Selesai</span>
            <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#15803D] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-[#0F172A] mt-2">
            {totalCompleted}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            Sesi latihan tuntas
          </p>
        </div>

        {/* Card 2: Soal Terjawab */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-card hover:shadow-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="ui-label">Soal Dikerjakan</span>
            <div className="w-8 h-8 rounded-lg bg-[#F7FEE7] text-[#4D7C0F] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-[#0F172A] mt-2">
            {totalQuestionsAnswered}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
            Butir soal dievaluasi
          </p>
        </div>

        {/* Card 3: Rata-rata Skor */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-card hover:shadow-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="ui-label">Rata-rata Nilai</span>
            <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0369A1] flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-[#0F172A] mt-2">
            {formattedAvgScore}
            <span className="text-lg text-[#64748B] ml-0.5">
              {totalCompleted > 0 ? avgScoreUnit : "%"}
            </span>
          </p>
          <p className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
            {avgScoreLabel}
          </p>
        </div>

        {/* Card 4: Dedikasi & Streak */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-card hover:shadow-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="ui-label">Dedikasi Belajar</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center">
              <Flame className="w-4 h-4 text-[#EA580C]" />
            </div>
          </div>
          <p className="text-xl font-bold text-[#0F172A] mt-2 truncate">
            {learningStatus}
          </p>
          <p className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#EA580C]" />
            {completedThisWeek} sesi minggu ini
          </p>
        </div>
      </section>

      {/* 3. Main Dashboard Grid (Asymmetrical Layout: 8 cols kiri + 4 cols kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Kolom Kiri (8 cols): Pilihan Mata Pelajaran & Aktivitas Latihan Terakhir */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          {/* Section: Eksplorasi Materi SMA (Course Cards style as in Image 1) */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight">
                  Pilihan Mata Pelajaran SMA
                </h2>
                <p className="text-xs text-[#64748B]">
                  Kurikulum Merdeka Kelas 10, 11, dan 12 • Langsung buat kuis
                </p>
              </div>
              <Link href="/bank-soal">
                <Button variant="tertiary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Lihat Semua
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {curatedSubjects.map((subj) => {
                const subStat = subjectStats.find((st) => st.name.toLowerCase() === subj.name.toLowerCase());
                const completedInSubj = subStat?.sessions || 0;

                return (
                  <Link
                    key={subj.id}
                    href={`/generator?subject=${subj.id}`}
                    className="p-4 rounded-xl border border-[#E5E7EB] bg-[#FAF9F5] hover:bg-white hover:border-[#16A34A] hover:shadow-card transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="green" size="xs">
                          {subj.tag}
                        </Badge>
                        <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#16A34A] transition-transform group-hover:translate-x-1" />
                      </div>
                      <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#16A34A] transition-colors">
                        {subj.name}
                      </h3>
                      <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1 leading-normal">
                        {subj.desc}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>{completedInSubj} sesi selesai</span>
                      <span className="font-semibold text-[#16A34A] group-hover:underline">
                        Latihan &rarr;
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Section: Recent Practice Activity (Latihan Terakhir) */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F3F4EE]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#16A34A]" />
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  Aktivitas Latihan Terakhir
                </h2>
              </div>

              {completedSessions.length > 0 && (
                <Link
                  href="/history"
                  className="text-xs font-semibold text-[#16A34A] hover:text-[#15803D] flex items-center gap-1"
                >
                  Riwayat ({completedSessions.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {completedSessions.length === 0 ? (
              <EmptyState
                title="Belum Ada Latihan yang Selesai"
                description="Mulai latihan pertamamu sekarang! Pilih mata pelajaran atau gunakan AI generator untuk membuat kuis terarah."
                action={
                  <Link href="/generator">
                    <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5" />}>
                      Mulai Latihan Sekarang
                    </Button>
                  </Link>
                }
                secondaryAction={
                  <Link href="/bank-soal">
                    <Button variant="outline" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />}>
                      Bank Soal
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {completedSessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl bg-[#FAF9F5] hover:bg-white border border-[#E5E7EB] hover:border-[#CBD5E1] hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="green" size="sm">
                          {s.subjectName || "SMA"}
                        </Badge>
                        <span className="text-xs font-bold text-[#0F172A] truncate max-w-[220px]">
                          {s.topicName || "Topik Materi"}
                        </span>
                        {s.config?.mode === "hots" && (
                          <Badge variant="coral" size="xs">
                            HOTS
                          </Badge>
                        )}
                        {s.config?.isRemedial && (
                          <Badge variant="sky" size="xs">
                            Remedial
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#94A3B8]" />
                        <span>
                          {new Date(s.startedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span>&bull;</span>
                        <span>{s.questionIds?.length || 0} Soal</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E7EB]">
                      <div className="text-left sm:text-right">
                        <div className="flex items-center gap-1 justify-start sm:justify-end">
                          <span className="text-base font-bold font-mono text-[#0F172A]">
                            {s.scoreFormatted
                              ? s.scoreFormatted
                              : s.score !== null && s.score !== undefined
                              ? formatIndonesianScore(s.score)
                              : "—"}
                            {s.score !== null && s.score !== undefined && s.scoringMethod !== "irt" ? "%" : ""}
                          </span>
                          {s.scoringMethod === "irt" && (
                            <Badge variant="green" size="xs">
                              IRT
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-[#64748B]">
                          {s.scoringMethod === "irt"
                            ? "Skor Terkalibrasi"
                            : `${s.correctCount ?? 0}/${s.questionIds?.length ?? 0} Benar`}
                        </p>
                      </div>

                      <Link href={`/results/${s.id}`}>
                        <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
                          Detail
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan (4 cols): Weekly Progress & Learning Distribution */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          {/* Widget 1: Weekly Progress Calendar (Inspirasi Image 1) */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#0F172A]">
                  Target Mingguan
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Konsistensi belajar harian
                </p>
              </div>
              <Badge variant="green" size="sm">
                {Math.min(completedThisWeek, 5)}/5 Sesi
              </Badge>
            </div>

            {/* 7-day strip */}
            <div className="grid grid-cols-7 gap-1.5 py-1 text-center">
              {weekDays.map((d) => (
                <div
                  key={d.name}
                  className={`flex flex-col items-center py-2 rounded-xl transition-all ${
                    d.isToday
                      ? "bg-[#16A34A] text-white shadow-xs font-bold"
                      : "bg-[#FAF9F5] text-[#334155] border border-[#E5E7EB]"
                  }`}
                >
                  <span className="text-[10px] uppercase">{d.name}</span>
                  <div className="mt-1">
                    {d.hasSession ? (
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          d.isToday ? "bg-white" : "bg-[#16A34A]"
                        }`}
                      />
                    ) : (
                      <span
                        className={`inline-block w-1.5 h-1.5 rounded-full ${
                          d.isToday ? "bg-white/40" : "bg-transparent"
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <ProgressBar
              value={completedThisWeek}
              max={5}
              variant="primary"
              size="sm"
            />

            <p className="text-[11px] text-[#64748B] flex items-center gap-1.5">
              {completedThisWeek >= 5 ? (
                <>
                  <Award className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span>Target mingguan tercapai! Lanjutkan prestasimu.</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span>
                    Selesaikan {5 - Math.min(completedThisWeek, 5)} sesi lagi minggu ini untuk memenuhi target.
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Widget 2: Learning Progress per Subject (Inspirasi Image 1 Activity Bar) */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-card space-y-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-[#0F172A]">
                Sebaran Latihan Materi
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Jumlah butir soal yang telah diselesaikan
              </p>
            </div>

            {subjectStats.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#64748B] space-y-2">
                <Compass className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <p>Belum ada catatan latihan. Mulai kuis pertamamu untuk memetakan capaian belajarmu.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjectStats.slice(0, 5).map((stat) => {
                  const maxCount = subjectStats[0]?.count || 1;
                  const ratio = Math.round((stat.count / maxCount) * 100);

                  return (
                    <div key={stat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#0F172A]">{stat.name}</span>
                        <span className="font-mono text-[#64748B]">
                          {stat.count} soal ({stat.sessions} sesi)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-[#F3F4EE] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#16A34A] rounded-full transition-all duration-300"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Widget 3: Quick Action Navigation */}
          <div className="bg-[#FAF9F5] border border-[#E5E7EB] rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#64748B]">
              Aksi Cepat
            </h3>
            <div className="space-y-2">
              <Link
                href="/generator"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#16A34A] transition-colors text-xs font-semibold text-[#0F172A]"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#EA580C]" />
                  <span>Generate Kuis AI Baru</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>
              <Link
                href="/bank-soal"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#16A34A] transition-colors text-xs font-semibold text-[#0F172A]"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#16A34A]" />
                  <span>Buka Bank Soal Kurikulum SMA</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>
              <Link
                href="/history"
                className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#16A34A] transition-colors text-xs font-semibold text-[#0F172A]"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#0284C7]" />
                  <span>Evaluasi & Riwayat Belajar</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 2. TEACHER DASHBOARD VIEW
// =========================================================================
function TeacherDashboardView({
  currentUser,
  todayFormatted,
  sessions,
}: {
  currentUser: User;
  todayFormatted: string;
  sessions: (PracticeSession & { subjectName?: string; topicName?: string })[];
}) {
  const completedCount = sessions.filter((s) => s.status === "completed").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Calendar className="w-3.5 h-3.5 text-[#16A34A]" />
            <span suppressHydrationWarning>{todayFormatted}</span>
            <span>&bull;</span>
            <Badge variant="sky" size="sm">
              Ruang Guru SMA
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Selamat Datang, {currentUser.displayName}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Panel kurikulum dan pengawasan bank soal latihan SMA. Kelola dan pantau mutu butir soal.
          </p>
        </div>

        <Link href="/bank-soal">
          <Button variant="primary" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Tambah Soal Baru
          </Button>
        </Link>
      </div>

      {/* Teacher KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-card">
          <p className="ui-label">Paket Soal Terverifikasi</p>
          <p className="text-3xl font-mono font-bold text-[#0F172A] mt-2">18+</p>
          <p className="text-[11px] text-[#64748B] mt-1">Paket aktif kurikulum SMA</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-card">
          <p className="ui-label">Cakupan Mata Pelajaran</p>
          <p className="text-3xl font-mono font-bold text-[#0F172A] mt-2">9</p>
          <p className="text-[11px] text-[#64748B] mt-1">Saintek, Soshum, Bahasa</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-card">
          <p className="ui-label">Latihan Diselesaikan Siswa</p>
          <p className="text-3xl font-mono font-bold text-[#0F172A] mt-2">{completedCount}</p>
          <p className="text-[11px] text-[#64748B] mt-1">Sesi latihan tuntas dievaluasi</p>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-card">
          <p className="ui-label">Metode Penilaian</p>
          <p className="text-2xl font-mono font-bold text-[#16A34A] mt-2">IRT 3-PL</p>
          <p className="text-[11px] text-[#64748B] mt-1">Kalibrasi daya pembeda & kesulitan</p>
        </div>
      </div>

      {/* Teacher Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card hoverable>
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center font-bold mb-2">
              <PlusCircle className="w-5 h-5" />
            </div>
            <CardTitle>Kelola Bank Soal SMA</CardTitle>
            <CardDescription>
              Tinjau butir soal terdaftar, lengkapi formula KaTeX, atur kunci jawaban A–E, dan perbarui pembahasan konsep.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/bank-soal">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Buka Manajemen Soal
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card hoverable>
          <CardHeader>
            <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] text-[#0369A1] flex items-center justify-center font-bold mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <CardTitle>Generate Paket Latihan AI</CardTitle>
            <CardDescription>
              Gunakan kecerdasan buatan untuk merancang soal HOTS dan materi spesifik Kurikulum Merdeka secara otomatis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/generator">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Buka Generator Soal
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =========================================================================
// 3. GUEST LANDING VIEW
// =========================================================================
function GuestLandingView() {
  const smaSubjects = [
    { name: "Matematika", id: "matematika", desc: "Aljabar, Trigonometri, Kalkulus, Matriks", tag: "Wajib & Peminatan" },
    { name: "Fisika", id: "fisika", desc: "Kinematika, Dinamika Newton, Termodinamika", tag: "Saintek" },
    { name: "Kimia", id: "kimia", desc: "Stoikiometri, Larutan Asam-Basa, Redoks", tag: "Saintek" },
    { name: "Biologi", id: "biologi", desc: "Biologi Sel, Genetika Mendel, Ekosistem", tag: "Saintek" },
    { name: "Ekonomi", id: "ekonomi", desc: "Mekanisme Pasar, Pendapatan Nasional, Akuntansi", tag: "Soshum" },
    { name: "Sosiologi", id: "sosiologi", desc: "Interaksi Sosial, Perubahan Sosial, Konflik", tag: "Soshum" },
    { name: "Geografi", id: "geografi", desc: "Litosfer, Atmosfer, SIG & Penginderaan Jauh", tag: "Soshum" },
    { name: "Bahasa Indonesia", id: "bahasa-indonesia", desc: "Teks Eksplanasi, Argumentasi, Karya Ilmiah", tag: "Umum" },
    { name: "Bahasa Inggris", id: "bahasa-inggris", desc: "Analytical Exposition, Reading Comprehension", tag: "Umum" },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 sm:pb-16 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="green" size="md">
              Kurikulum Merdeka 2026 • SMA Kelas 10, 11, dan 12
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15]">
              Kuasai Materi Pelajaran SMA dengan{" "}
              <span className="text-[#16A34A]">Penilaian Terkalibrasi</span> & Evaluasi Terarah
            </h1>

            <p className="text-sm sm:text-base text-[#475569] max-w-2xl leading-relaxed">
              Platform latihan mandiri siswa SMA. Dilengkapi bank soal berstandar nasional, penulisan rumus KaTeX presisi, penilaian IRT (Item Response Theory), dan pembahasan konsep mendalam.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 w-full sm:w-auto justify-center">
              <Link href="/generator" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="w-full" leftIcon={<Sparkles className="w-4 h-4" />}>
                  Mulai Latihan Mandiri
                </Button>
              </Link>
              <Link href="/bank-soal" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full" leftIcon={<Layers className="w-4 h-4 text-[#16A34A]" />}>
                  Jelajahi Bank Soal
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Masuk Akun
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive KaTeX Formula Showcase */}
          <div className="mt-10 sm:mt-12 max-w-4xl mx-auto">
            <div className="bg-[#FAF9F5] border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#0F172A]">
                    Notasi Formula KaTeX Standar UTBK & Kurikulum SMA
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Penulisan simbol matematika, fisika, dan kimia terstruktur tanpa layout shift
                  </p>
                </div>
                <Badge variant="green" size="sm">
                  KaTeX Validated
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                    Fisika (Dinamika Gerak)
                  </p>
                  <div className="text-sm text-[#0F172A] font-semibold py-1">
                    <MathRenderer text="\\[ \vec{F}_{\text{total}} = m \cdot \vec{a} = \frac{d\vec{p}}{dt} \\]" />
                  </div>
                  <p className="text-[11px] text-[#64748B]">Hukum II Newton</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                    Matematika (Kalkulus Integral)
                  </p>
                  <div className="text-sm text-[#0F172A] font-semibold py-1">
                    <MathRenderer text="\\[ \int_0^1 x^2 \, dx = \left[ \frac{x^3}{3} \right]_0^1 = \frac{1}{3} \\]" />
                  </div>
                  <p className="text-[11px] text-[#64748B]">Teorema Dasar Kalkulus</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E5E7EB]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                    Fisika Modern (Relativitas)
                  </p>
                  <div className="text-sm text-[#0F172A] font-semibold py-1">
                    <MathRenderer text="\\[ E^2 = (pc)^2 + (m_0 c^2)^2 \\]" />
                  </div>
                  <p className="text-[11px] text-[#64748B]">Relasi Energi-Momentum</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="ui-label text-[#16A34A]">Keunggulan Pembelajaran</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight mt-1">
            Mengapa Berlatih di NemoLearn?
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Dirancang secara spesifik untuk meningkatkan pemahaman konsep, bukan sekadar hafalan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#15803D] flex items-center justify-center font-bold mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <CardTitle>Kurikulum Merdeka SMA Lengkap</CardTitle>
              <CardDescription>
                Mencakup 9 mata pelajaran SMA esensial untuk kelas 10, 11, dan 12. Soal terstruktur berdasarkan capaian pembelajaran bertahap.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
                <Check className="w-4 h-4" />
                <span>Saintek, Soshum, dan Bahasa</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-[#F7FEE7] text-[#4D7C0F] flex items-center justify-center font-bold mb-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <CardTitle>Penilaian IRT (Item Response Theory)</CardTitle>
              <CardDescription>
                Mengukur parameter kemampuan siswa (skala standar 200–1.000) menggunakan model 3-PL terkalibrasi berstandar seleksi nasional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4D7C0F]">
                <Check className="w-4 h-4" />
                <span>Skor terkalibrasi ilmiah</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] text-[#C2410C] flex items-center justify-center font-bold mb-2">
                <Sparkles className="w-5 h-5 text-[#EA580C]" />
              </div>
              <CardTitle>Pembahasan Konseptual Terstruktur</CardTitle>
              <CardDescription>
                Setiap butir soal dilengkapi penalaran langkah demi langkah (step-by-step) untuk membedah akar konsep dan cara berpikir ilmiah.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C2410C]">
                <Check className="w-4 h-4" />
                <span>Kunci jawaban aman tanpa bocor</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Subject List Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="ui-label text-[#16A34A]">Materi Terbuka</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight mt-1">
              9 Mata Pelajaran Kurikulum SMA
            </h2>
            <p className="text-xs text-[#64748B]">
              Tersedia untuk latihan mandiri berbasis kemampuan
            </p>
          </div>
          <Link href="/bank-soal">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Buka Semua Bank Soal
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {smaSubjects.map((sub) => (
            <Link
              key={sub.id}
              href={`/generator?subject=${sub.id}`}
              className="p-4 rounded-xl border border-[#E5E7EB] bg-white hover:border-[#16A34A] hover:shadow-card transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="green" size="xs">
                    {sub.tag}
                  </Badge>
                  <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#16A34A] transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#16A34A] transition-colors">
                  {sub.name}
                </h3>
                <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">
                  {sub.desc}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-[#F3F4EE] flex items-center justify-between text-[11px]">
                <span className="text-[#64748B]">Kurikulum Merdeka</span>
                <span className="font-semibold text-[#16A34A]">Latihan &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
