"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Download,
  AlertTriangle,
  Database,
  Cpu,
  Server,
  Activity,
  Layers,
  ArrowRight,
} from "lucide-react";
import { AdminDashboardStats } from "@/types/admin";
import { AdminContentContainer } from "@/components/admin/AdminContentContainer";
import { OverviewKpiCards } from "@/components/admin/overview/OverviewKpiCards";
import { GrowthTrendAreaChart } from "@/components/admin/overview/GrowthTrendAreaChart";
import { SubjectDistributionDonutChart } from "@/components/admin/overview/SubjectDistributionDonutChart";
import { RecentActivityFeed } from "@/components/admin/overview/RecentActivityFeed";
import { LearningEfficiencyCard } from "@/components/admin/overview/LearningEfficiencyCard";
import { toast } from "@/components/admin/ui/AdminToast";
import { cn } from "@/lib/utils";

const DATE_RANGES = [
  { label: "7 Hari Terakhir", days: 7 },
  { label: "30 Hari Terakhir", days: 30 },
  { label: "Kuartal Ini", days: 30 },
  { label: "Kustom", days: 14 },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRangeLabel, setActiveRangeLabel] = useState("30 Hari Terakhir");
  const [selectedDays, setSelectedDays] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("Baru saja");

  const fetchDashboardStats = (days: number, isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);
    else setLoading(true);
    setError(null);

    fetch(`/api/admin/stats?days=${days}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.data) {
          setStats(data.data);
          setLastUpdated(
            new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }) + " WIB"
          );
          if (isManual) {
            toast.success("Metrik telemetri berhasil dimuat ulang secara real-time.");
          }
        } else {
          throw new Error("Format data statistik tidak valid.");
        }
      })
      .catch((err) => {
        console.error("Gagal memuat statistik admin:", err);
        setError(err.message || "Gagal memuat data dashboard.");
        if (isManual) {
          toast.error("Gagal memperbarui data: " + (err.message || "Kesalahan jaringan."));
        }
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  useEffect(() => {
    fetchDashboardStats(selectedDays);
  }, [selectedDays]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (!stats) return;

    try {
      const rows = [
        ["METRIK OPERASIONAL NEMOLEARN", "NILAI"],
        ["Tanggal Ekspor", new Date().toISOString()],
        ["Periode", `${selectedDays} Hari Terakhir`],
        ["Total Pengguna", stats.users.total],
        ["Pengguna Aktif", stats.users.active],
        ["Siswa Terdaftar", stats.users.byRole?.pelajar || 0],
        ["Guru Terverifikasi", stats.users.byRole?.guru || 0],
        ["Total Bank Soal", stats.questions.total],
        ["Soal HOTS", stats.questions.hots || 0],
        ["Total Sesi Belajar", stats.sessions.total],
        ["Sesi Selesai", stats.sessions.completed],
        ["Rata-rata Skor", stats.sessions.avgScoreFormatted || "0,00"],
        ["Total Request AI", stats.ai.totalRequests],
        ["Tingkat Kesalahan AI", `${stats.ai.errorRate}%`],
      ];

      const csvContent =
        "data:text/csv;charset=utf-8," +
        rows.map((e) => e.map((cell) => `"${cell}"`).join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `nemolearn_ringkasan_analitik_${selectedDays}hari_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Laporan analitik berhasil diunduh dalam format .CSV.");
    } catch {
      toast.error("Gagal mengekspor laporan data.");
    }
  };

  if (loading && !stats) {
    return (
      <AdminContentContainer subsystemTag="LIVE TELEMETRY" pulseLive>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D1E9FF] border border-[#B2DDFF] flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-[#0B559F]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#101828]">
              Memuat Ringkasan & Analitik Eksekutif...
            </h3>
            <p className="text-xs text-[#475467] mt-0.5 font-mono">
              Mengumpulkan telemetri dari database, audit logs, dan AI provider.
            </p>
          </div>
        </div>
      </AdminContentContainer>
    );
  }

  if (error && !stats) {
    return (
      <AdminContentContainer subsystemTag="ERROR_ALERT">
        <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-sapphire-card text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FEE4E2] text-[#D92D20] border border-[#FECDCA] flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#101828]">
              Gagal Memuat Dashboard
            </h3>
            <p className="text-xs text-[#D92D20] mt-1 font-mono">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchDashboardStats(selectedDays)}
            className="px-4 py-2 rounded-xl bg-[#0B559F] text-white text-xs font-semibold hover:bg-[#094582] transition-colors"
          >
            Coba Muat Ulang
          </button>
        </div>
      </AdminContentContainer>
    );
  }

  if (!stats) return null;

  return (
    <AdminContentContainer subsystemTag="LIVE TELEMETRY" pulseLive>
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Top Control Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#D1E9FF] text-[#062C54] border border-[#B2DDFF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B559F] animate-pulse" />
                LIVE TELEMETRY
              </span>
              <span className="text-xs font-mono text-[#667085]">
                Update: {lastUpdated}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold font-sans text-[#101828] tracking-tight">
              Ringkasan & Analitik Eksekutif
            </h1>
            <p className="text-xs sm:text-sm text-[#475467] max-w-2xl leading-relaxed">
              Pantau pertumbuhan siswa, aktivitas belajar harian, dan metrik operasional NemoLearn secara real-time.
            </p>
          </div>

          {/* Actions & Date Range Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-xs">
              {DATE_RANGES.map((r) => {
                const isActive = activeRangeLabel === r.label;
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => {
                      setActiveRangeLabel(r.label);
                      setSelectedDays(r.days);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors select-none",
                      isActive
                        ? "bg-[#D1E9FF] text-[#062C54] font-semibold shadow-xs"
                        : "text-[#475467] hover:text-[#101828] hover:bg-[#F8FAFC]"
                    )}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isRefreshing}
                onClick={() => fetchDashboardStats(selectedDays, true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#101828] text-xs font-semibold transition-all shadow-xs group disabled:opacity-50"
              >
                <RefreshCw
                  className={cn(
                    "w-3.5 h-3.5 text-[#0B559F] transition-transform duration-500",
                    isRefreshing ? "animate-spin" : "group-hover:rotate-180"
                  )}
                />
                <span>Refresh Data</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B559F] hover:bg-[#094582] text-white font-semibold text-xs shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Laporan (.CSV)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. Primary Metric KPI Cards (5 Columns) */}
        <OverviewKpiCards stats={stats} analytics={stats.analytics} />

        {/* 2. Visual Charts Grid (2/3 vs 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Trend Growth & Platform Activity (2/3 width) */}
          <div className="lg:col-span-2">
            <GrowthTrendAreaChart
              platformActivity={stats.analytics?.platformActivity}
              userGrowth={stats.analytics?.userGrowth}
              selectedDays={selectedDays}
            />
          </div>

          {/* Right: Subject Distribution (1/3 width) */}
          <div className="lg:col-span-1">
            <SubjectDistributionDonutChart
              questionBank={stats.analytics?.questionBank}
              totalSessions={stats.sessions.total}
            />
          </div>
        </div>

        {/* 3. Bottom Grid: Recent Activity Feed & Learning Efficiency (2/3 vs 1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Real-time Activity Feed (2/3 width) */}
          <div className="lg:col-span-2">
            <RecentActivityFeed
              recentSessions={stats.recentSessions}
              recentLogs={stats.recentLogs}
            />
          </div>

          {/* Right: Learning Efficiency & AI Performance (1/3 width) */}
          <div className="lg:col-span-1">
            <LearningEfficiencyCard stats={stats} />
          </div>
        </div>

        {/* 4. Subsystems Operational Status Row */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sapphire-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0FA97A]" />
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#101828]">
                Status Operasional Subsistem Platform
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#667085]">
              Real-time Host Engine Diagnostics
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Database Subsystem */}
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#0FA97A]">
                  <Database className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#101828]">Database Core Store</p>
                  <p className="text-[10px] text-[#667085] font-mono">
                    {stats.systemHealth?.database?.latencyMs || 2}ms ping • {stats.systemHealth?.database?.itemsCount || 0} entri
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#D1FADF] text-[#054F38] border border-[#A6F4C5]">
                {stats.systemHealth?.database?.status || "HEALTHY"}
              </span>
            </div>

            {/* AI Generation Engine */}
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#53389E]">
                  <Cpu className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#101828]">AI Generation Engine</p>
                  <p className="text-[10px] text-[#667085] font-mono truncate max-w-[150px]">
                    {stats.ai.provider} • {stats.ai.model}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#E9D7FE] text-[#2C1C5F] border border-[#D6BBFB]">
                {stats.ai.errorRate <= 10 ? "HEALTHY" : "DEGRADED"}
              </span>
            </div>

            {/* Next.js Server Runtime */}
            <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#0B559F]">
                  <Server className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#101828]">Next.js API Runtime</p>
                  <p className="text-[10px] text-[#667085] font-mono">
                    {stats.systemHealth?.apiServer?.memoryUsageMb || 64} MB Heap • {stats.systemHealth?.apiServer?.uptimeFormatted || "Aktif"}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#D1E9FF] text-[#062C54] border border-[#B2DDFF]">
                {stats.systemHealth?.apiServer?.status || "HEALTHY"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminContentContainer>
  );
}
