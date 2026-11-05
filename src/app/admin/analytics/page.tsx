"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  RefreshCw,
  Users,
  Activity,
  Cpu,
  Layers,
  Award,
  Filter,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { UserGrowthChart } from "@/components/admin/charts/UserGrowthChart";
import { PlatformActivityChart } from "@/components/admin/charts/PlatformActivityChart";
import { AIUsageAnalyticsChart } from "@/components/admin/charts/AIUsageAnalyticsChart";
import { QuestionBankChart } from "@/components/admin/charts/QuestionBankChart";
import { ScoreDistributionChart } from "@/components/admin/charts/ScoreDistributionChart";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { FullAdminAnalytics } from "@/types/admin";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<FullAdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeView, setActiveView] = useState<"all" | "users" | "activity" | "ai" | "questions" | "scores">("all");

  const fetchAnalytics = useCallback(async (days: number, isRefreshAction = false) => {
    if (isRefreshAction) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetch(`/api/admin/analytics?days=${days}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat analitik operasional platform.");
      }

      setAnalytics(json.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat grafik.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(selectedDays);
  }, [fetchAnalytics, selectedDays]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner & Range Selector */}
      <div className="rounded-3xl bg-[#0F172A] p-6 sm:p-8 text-white relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#16A34A]/20 via-[#2563EB]/15 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Database Sync
              </span>
              {analytics?.generatedAt && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Diperbarui: {new Date(analytics.generatedAt).toLocaleTimeString("id-ID")} WIB
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Analitik & Grafik Database NemoLearn
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Eksplorasi data operasional riil: pertumbuhan pengguna, intensitas latihan kuis, performa model AI, dan psikometri IRT 3-PL terkalibrasi.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Days Selector */}
            <div className="flex items-center bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSelectedDays(days)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer",
                    selectedDays === days
                      ? "bg-[#16A34A] text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  {days} Hari
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnalytics(selectedDays, true)}
              disabled={isRefreshing}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-800 rounded-2xl"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isRefreshing ? "animate-spin" : "")} />
              Segarkan
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="xs" onClick={() => fetchAnalytics(selectedDays)}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Quick KPI Ribbon */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-xs font-bold uppercase tracking-wider">Pengguna Baru</span>
              <Users className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[#0F172A]">
                +{analytics.userGrowth.totalNewInPeriod}
              </span>
              <span className="text-[11px] text-[#64748B]">({selectedDays} hari)</span>
            </div>
            <p className="text-[11px] text-[#16A34A] font-semibold">
              {analytics.userGrowth.totalUsersOverall} total akun terdaftar
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-xs font-bold uppercase tracking-wider">Sesi Kuis Siswa</span>
              <Activity className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[#0F172A]">
                {analytics.platformActivity.totalCompletedInPeriod}
              </span>
              <span className="text-[11px] text-[#64748B]">/ {analytics.platformActivity.totalStartedInPeriod}</span>
            </div>
            <p className="text-[11px] text-[#2563EB] font-semibold">
              {analytics.platformActivity.completionRateInPeriod}% tingkat penyelesaian
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-xs font-bold uppercase tracking-wider">Tingkat Sukses AI</span>
              <Cpu className="w-4 h-4 text-[#7C3AED]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[#0F172A]">
                {analytics.aiAnalytics.successRate}%
              </span>
              <span className="text-[11px] text-[#64748B]">sukses</span>
            </div>
            <p className="text-[11px] text-[#7C3AED] font-semibold">
              {analytics.aiAnalytics.avgLatencyMs} ms rerata waktu respons
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[#64748B]">
              <span className="text-xs font-bold uppercase tracking-wider">Bank Soal HOTS</span>
              <Layers className="w-4 h-4 text-[#EA580C]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[#0F172A]">
                {analytics.questionBank.hotsProportion.hots}
              </span>
              <span className="text-[11px] text-[#64748B]">
                / {analytics.questionBank.hotsProportion.total} butir
              </span>
            </div>
            <p className="text-[11px] text-[#EA580C] font-semibold">
              {analytics.questionBank.hotsProportion.hotsPercentage}% standar penalaran tinggi
            </p>
          </div>
        </div>
      )}

      {/* Filter Navigation Bar */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#E2E8F0] shadow-2xs">
          {[
            { id: "all", label: "Seluruh Grafik" },
            { id: "users", label: "Pengguna" },
            { id: "activity", label: "Aktivitas Kuis" },
            { id: "ai", label: "Utilisasi AI" },
            { id: "questions", label: "Bank Soal" },
            { id: "scores", label: "Hasil & Skor" },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveView(v.id as any)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap",
                activeView === v.id
                  ? "bg-[#0F172A] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B]">
          <HelpCircle className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>Seluruh metrik berasal dari query database aktif</span>
        </div>
      </div>

      {/* Loading State when analytics is null */}
      {loading && !analytics && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-[#16A34A]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">Memuat Analitik Database...</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Mengumpulkan agregasi transaksi riil kuis, pertumbuhan pengguna, dan utilisasi AI.
            </p>
          </div>
        </div>
      )}

      {/* Charts Area */}
      {analytics && (
        <div className="space-y-8">
          {/* 1. User Growth Chart */}
          {(activeView === "all" || activeView === "users") && (
            <UserGrowthChart
              data={analytics.userGrowth.trend}
              totalNewInPeriod={analytics.userGrowth.totalNewInPeriod}
              totalUsersOverall={analytics.userGrowth.totalUsersOverall}
              selectedDays={selectedDays}
              onChangeDays={setSelectedDays}
              loading={loading}
              error={error}
            />
          )}

          {/* 2. Platform Activity Chart */}
          {(activeView === "all" || activeView === "activity") && (
            <PlatformActivityChart
              data={analytics.platformActivity.trend}
              totalStartedInPeriod={analytics.platformActivity.totalStartedInPeriod}
              totalCompletedInPeriod={analytics.platformActivity.totalCompletedInPeriod}
              completionRateInPeriod={analytics.platformActivity.completionRateInPeriod}
              selectedDays={selectedDays}
              onChangeDays={setSelectedDays}
              loading={loading}
              error={error}
            />
          )}

          {/* 3. AI Usage Chart */}
          {(activeView === "all" || activeView === "ai") && (
            <AIUsageAnalyticsChart
              data={analytics.aiAnalytics}
              selectedDays={selectedDays}
              onChangeDays={setSelectedDays}
              loading={loading}
              error={error}
            />
          )}

          {/* 4. Question Bank Distribution Chart */}
          {(activeView === "all" || activeView === "questions") && (
            <QuestionBankChart
              data={analytics.questionBank}
              loading={loading}
              error={error}
            />
          )}

          {/* 5. Score Distribution & Evaluation Chart */}
          {(activeView === "all" || activeView === "scores") && (
            <ScoreDistributionChart
              data={analytics.scoreAnalytics}
              selectedDays={selectedDays}
              loading={loading}
              error={error}
            />
          )}
        </div>
      )}
    </div>
  );
}
