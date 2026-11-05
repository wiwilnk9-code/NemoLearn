"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/types/user";
import { AIProviderType } from "@/types/ai";
import { AdminContentContainer } from "@/components/admin/AdminContentContainer";
import { AdminConfirmDialog } from "@/components/admin/ui/AdminConfirmDialog";
import { toast, AdminToastContainer } from "@/components/admin/ui/AdminToast";
import { AiMetricsOverviewCards } from "@/components/admin/ai/AiMetricsOverviewCards";
import {
  AiProviderHealthMatrix,
  ProviderHealthItem,
} from "@/components/admin/ai/AiProviderHealthMatrix";
import {
  AiLatencyThroughputChart,
  ThroughputPoint,
} from "@/components/admin/ai/AiLatencyThroughputChart";
import {
  AiCostModelBreakdown,
  ModelUsageBreakdownItem,
} from "@/components/admin/ai/AiCostModelBreakdown";
import {
  AiRequestStreamTable,
} from "@/components/admin/ai/AiRequestStreamTable";
import {
  AiPayloadInspectorModal,
  TelemetryPayloadItem,
} from "@/components/admin/ai/AiPayloadInspectorModal";
import { AiRoutingConfigModal } from "@/components/admin/ai/AiRoutingConfigModal";
import { AiQuotaManagementSection } from "@/components/admin/ai/AiQuotaManagementSection";
import {
  Cpu,
  RefreshCw,
  Trash2,
  Sliders,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Sparkles,
  Key,
} from "lucide-react";

export default function AdminAiMonitoringPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  // Telemetry data state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [kpi, setKpi] = useState({
    totalRequests: 0,
    requests24h: 0,
    avgLatencyMs: 0,
    p95LatencyMs: 0,
    errorRate: 0,
    successRate: 100,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    estimatedTotalCost: 0,
    budgetTotal: 100,
    budgetUsedPercentage: 0,
    failedRequests: 0,
  });
  const [providers, setProviders] = useState<ProviderHealthItem[]>([]);
  const [models, setModels] = useState<ModelUsageBreakdownItem[]>([]);
  const [throughputPoints, setThroughputPoints] = useState<ThroughputPoint[]>([]);
  const [historyLogs, setHistoryLogs] = useState<TelemetryPayloadItem[]>([]);

  // Active settings state
  const [activeTab, setActiveTab] = useState<"telemetry" | "quotas">("telemetry");
  const [activeSettings, setActiveSettings] = useState<{
    provider: AIProviderType;
    model: string;
    baseUrl?: string;
    timeoutMs: number;
    hasKey: boolean;
    maskedKey?: string;
  }>({
    provider: "gemini",
    model: "gemini-1.5-flash",
    timeoutMs: 20000,
    hasKey: false,
  });

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [rangeHours, setRangeHours] = useState(24);

  // Modals state
  const [selectedPayload, setSelectedPayload] = useState<TelemetryPayloadItem | null>(null);
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [purging, setPurging] = useState(false);

  const showToast = (
    title: string,
    description?: string,
    type: "success" | "error" | "warning" | "info" = "success"
  ) => {
    if (type === "success") toast.success(title, description);
    else if (type === "error") toast.error(title, description);
    else if (type === "warning") toast.warning(title, description);
    else toast.info(title, description);
  };

  // 1. Fetch User & Permission
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          const isOwner = data.user.role === "owner";
          const isAdminWithPerm =
            data.user.role === "admin" &&
            (data.user.adminPermissions?.includes("manage_ai") || isOwner);
          setHasPermission(isOwner || isAdminWithPerm);
        }
      })
      .catch((err) => console.error("Gagal verifikasi role:", err))
      .finally(() => setUserLoading(false));
  }, []);

  // 2. Fetch Telemetry Data
  const fetchTelemetry = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      else setRefreshing(true);

      try {
        const params = new URLSearchParams({
          rangeHours: String(rangeHours),
          provider: providerFilter,
          status: statusFilter,
          search: searchQuery,
          limit: "30",
        });

        const res = await fetch(`/api/admin/ai/metrics?${params.toString()}`);
        if (!res.ok) throw new Error("Gagal mengambil metrik telemetri AI.");

        const data = await res.json();
        if (data.success) {
          setKpi(data.kpi);
          setProviders(data.providers || []);
          setModels(data.modelBreakdown || []);
          setThroughputPoints(data.throughputTimeSeries || []);
          setHistoryLogs(data.history || []);
          if (data.activeSettings) {
            setActiveSettings(data.activeSettings);
          }
        }
      } catch (err: any) {
        if (!isBackground) {
          showToast("Error", err.message || "Gagal memuat telemetri AI.", "error");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [rangeHours, providerFilter, statusFilter, searchQuery]
  );

  useEffect(() => {
    if (hasPermission) {
      fetchTelemetry();
    }
  }, [hasPermission, fetchTelemetry]);

  // 3. Auto-refresh interval (60 seconds)
  useEffect(() => {
    if (!hasPermission) return;
    const interval = setInterval(() => {
      fetchTelemetry(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [hasPermission, fetchTelemetry]);

  // 4. Action: Live Ping Provider
  const handlePingProvider = async (providerType: AIProviderType) => {
    try {
      const res = await fetch("/api/admin/ai/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerType }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Ping Berhasil", `${data.provider} merespons dalam ${data.latencyMs}ms.`, "success");
      } else {
        showToast("Ping Gagal", data.message || "Koneksi tidak dapat terhubung.", "error");
      }
      return data;
    } catch (err: any) {
      const errorMsg = err.message || "Gagal melakukan ping provider.";
      showToast("Ping Error", errorMsg, "error");
      return { success: false, message: errorMsg };
    }
  };

  // 5. Action: Select Primary Provider Fast Switch
  const handleSelectPrimary = async (providerType: AIProviderType) => {
    try {
      const res = await fetch("/api/settings/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: providerType,
          apiKey: "keep_existing",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Routing Diperbarui", `Engine utama kini beralih ke ${providerType}.`, "success");
        fetchTelemetry(true);
      } else {
        showToast("Gagal Mengubah Engine", data.error || "Gagal memperbarui routing.", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "Terjadi kesalahan server.", "error");
    }
  };

  // 6. Action: Save Routing Config from Modal
  const handleSaveRouting = async (newConfig: {
    provider: AIProviderType;
    model: string;
    apiKey?: string;
    baseUrl?: string;
    timeoutMs: number;
  }): Promise<boolean> => {
    const res = await fetch("/api/settings/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newConfig),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast("Konfigurasi Tersimpan", "Routing provider dan API settings berhasil diperbarui.", "success");
      fetchTelemetry(true);
      return true;
    } else {
      throw new Error(data.error || "Gagal menyimpan konfigurasi routing.");
    }
  };

  // 7. Action: Test Routing Config
  const handleTestRouting = async (testConfig: {
    provider: AIProviderType;
    model: string;
    apiKey?: string;
    baseUrl?: string;
    timeoutMs: number;
  }) => {
    const res = await fetch("/api/settings/ai/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testConfig),
    });
    const data = await res.json();
    return {
      success: data.success,
      message: data.message || (data.success ? "Koneksi berhasil terhubung." : "Gagal terhubung."),
      latencyMs: data.latencyMs,
    };
  };

  // 8. Action: Purge Prompt Cache
  const handleConfirmPurgeCache = async () => {
    setPurging(true);
    try {
      const res = await fetch("/api/admin/ai/purge-cache", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Cache Dikosongkan", data.message, "success");
      } else {
        showToast("Gagal", data.error || "Gagal mengosongkan cache.", "error");
      }
    } catch (err: any) {
      showToast("Error", err.message || "Gagal mengosongkan cache.", "error");
    } finally {
      setPurging(false);
      setIsPurgeConfirmOpen(false);
    }
  };

  // 9. Action: Download CSV Export
  const handleExportCsv = () => {
    window.open("/api/admin/ai/export", "_blank");
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B559F]" />
          <p className="text-xs font-mono text-[#64748B]">Memverifikasi akses AI Monitoring...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 text-center bg-white border border-[#FECDCA] rounded-xl shadow-xs">
        <ShieldAlert className="w-12 h-12 text-[#D92D20] mx-auto mb-3" />
        <h2 className="text-lg font-bold text-[#101828]">Akses Terbatas: Izin Ditolak</h2>
        <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
          Halaman AI Monitoring &amp; Engine Telemetry hanya dapat diakses oleh Administrator dengan izin{" "}
          <code className="text-[#0B559F] font-mono">manage_ai</code> atau Platform Owner.
        </p>
      </div>
    );
  }

  return (
    <AdminContentContainer
      subsystemTag="AI_TELEMETRY_V2 // NEURAL INFERENCE GATEWAY"
      breadcrumbItems={[
        { label: "Admin", href: "/admin" },
        { label: "AI Monitoring & Engine" },
      ]}
    >
      <div className="flex flex-col w-full pb-16 space-y-6">
        {/* Top Command & Status Bar (Google Stitch Reference) */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pt-1">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wide uppercase bg-[#EFF4FF] text-[#0B559F] border border-[#B2DDFF]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0FA97A] animate-ping" />
                Cluster ID: AP-ID-NEMO-LLM-09
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">|</span>
              <span className="text-xs font-mono text-[#64748B]">Gateway Envoy v1.28.3</span>
              <span className="text-xs font-mono text-[#94A3B8]">|</span>
              <span className="text-xs font-mono text-[#0B559F] font-semibold">
                Active: {activeSettings.provider} ({activeSettings.model})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101828]">
              AI Telemetri &amp; Monitoring Infrastruktur
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-3xl mt-1">
              Pantau konsumsi token, performa latency model AI, error rate, estimasi biaya harian, dan kesehatan provider AI secara langsung.
            </p>
          </div>

          {/* Quick Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-mono text-[#0FA97A] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#0FA97A]" />
              <span className="text-[#101828] font-medium">Live Telemetry Active</span>
              <span className="text-[#64748B] text-[11px]">(60s refresh)</span>
            </div>

            <button
              onClick={() => fetchTelemetry(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#101828] border border-[#CBD5E1] transition-colors shadow-xs"
              title="Refresh metrik"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#64748B] ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              onClick={() => setIsPurgeConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#101828] border border-[#CBD5E1] transition-colors shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#53389E]" />
              <span>Purge Cache Prompt</span>
            </button>

            <button
              onClick={() => setIsRoutingModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0B559F] hover:bg-[#08427B] text-white text-xs font-semibold tracking-tight shadow-xs transition-all"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Ubah Routing Provider</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("telemetry")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "telemetry"
                ? "border-[#16A34A] text-[#16A34A]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Cpu className="w-4 h-4" />
            AI Telemetri &amp; Provider Health
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("quotas")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "quotas"
                ? "border-[#16A34A] text-[#16A34A]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Key className="w-4 h-4" />
            Akses Pengguna &amp; Manajemen Kuota AI
          </button>
        </div>

        {activeTab === "quotas" ? (
          <AiQuotaManagementSection currentUser={currentUser} onToast={showToast} />
        ) : (
          <>
            {/* 1. Primary Infrastructure Metrics (5 Bento Grid) */}
            <AiMetricsOverviewCards kpi={kpi} />

            {/* 2. AI Provider Health Matrix (4 Connected Engines) */}
            <AiProviderHealthMatrix
              providers={providers}
              onPingProvider={handlePingProvider}
              onSelectPrimary={handleSelectPrimary}
              onOpenSettings={() => setIsRoutingModalOpen(true)}
            />

            {/* 3. Deep Dive Analytics (2 Cols Latency Chart + 1 Col Cost Breakdown) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <AiLatencyThroughputChart
                  data={throughputPoints}
                  p95Latency={kpi.p95LatencyMs}
                  avgLatency={kpi.avgLatencyMs}
                  selectedRangeHours={rangeHours}
                  onRangeChange={(h) => setRangeHours(h)}
                />
              </div>
              <div className="xl:col-span-1">
                <AiCostModelBreakdown
                  models={models}
                  totalCost={kpi.estimatedTotalCost}
                  onExportCsv={handleExportCsv}
                />
              </div>
            </div>

            {/* 4. Live Request & Error Stream Log Table */}
            <AiRequestStreamTable
              logs={historyLogs}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              providerFilter={providerFilter}
              onProviderFilterChange={setProviderFilter}
              onInspectPayload={(log) => setSelectedPayload(log)}
              onExportCsv={handleExportCsv}
              loading={loading}
            />
          </>
        )}
      </div>

      {/* Payload Inspector Modal */}
      <AiPayloadInspectorModal
        isOpen={Boolean(selectedPayload)}
        payload={selectedPayload}
        onClose={() => setSelectedPayload(null)}
      />

      {/* Provider Routing Config Modal */}
      <AiRoutingConfigModal
        isOpen={isRoutingModalOpen}
        onClose={() => setIsRoutingModalOpen(false)}
        currentProvider={activeSettings.provider}
        currentModel={activeSettings.model}
        currentBaseUrl={activeSettings.baseUrl}
        currentTimeoutMs={activeSettings.timeoutMs}
        hasStoredKey={activeSettings.hasKey}
        maskedKey={activeSettings.maskedKey}
        onSave={handleSaveRouting}
        onTest={handleTestRouting}
      />

      {/* Purge Cache Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={isPurgeConfirmOpen}
        title="Kosongkan Cache Prompt Penjelasan?"
        message="Aksi ini akan menghapus seluruh cache penjelasan butir soal yang tersimpan di memori server. Pertanyaan berikutnya akan di-generate ulang dari AI. Lanjutkan?"
        confirmLabel={purging ? "Mengosongkan..." : "Ya, Kosongkan Cache"}
        variant="warning"
        isLoading={purging}
        onConfirm={handleConfirmPurgeCache}
        onClose={() => setIsPurgeConfirmOpen(false)}
      />

      {/* Global Toast Container */}
      <AdminToastContainer />
    </AdminContentContainer>
  );
}
