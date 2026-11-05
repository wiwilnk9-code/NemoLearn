"use client";

import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/types/user";
import { AiQuotaConfig } from "@/types/settings";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Sliders,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Save,
  Users,
  Activity,
  Key,
  Clock,
  Sparkles,
  Edit2,
  Loader2,
} from "lucide-react";

interface UserQuotaSummary {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  hasAiAccess: boolean;
  isOwner: boolean;
  dailyAiQuotaOverride: number | null;
  effectiveDailyQuota: number;
  requestsUsed: number;
  requestsReserved: number;
  questionsGenerated: number;
  remainingQuota: number;
  aiAccessGrantedBy: string | null;
  aiAccessGrantedAt: string | null;
  lastRequestAt: string | null;
}

interface OverviewData {
  quotaDate: string;
  resetTimeIso: string;
  config: AiQuotaConfig;
  stats: {
    globalDailyLimit: number;
    totalRequestsUsed: number;
    totalRequestsReserved: number;
    remainingGlobalRequests: number;
    totalQuestionsGenerated: number;
    totalTokensConsumed: number;
    activeAuthorizedUsersCount: number;
    totalUsersCount: number;
  };
  users: UserQuotaSummary[];
}

interface Props {
  currentUser: User | null;
  onToast: (title: string, description?: string, type?: "success" | "error" | "warning" | "info") => void;
}

export const AiQuotaManagementSection: React.FC<Props> = ({ currentUser, onToast }) => {
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [data, setData] = useState<OverviewData | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState<"all" | "authorized" | "unauthorized">("all");

  // Config Form State
  const [configForm, setConfigForm] = useState<AiQuotaConfig>({
    enabled: true,
    emergencyShutdown: false,
    ownerDailyQuota: 50,
    defaultUserDailyQuota: 10,
    globalDailyLimit: 200,
    globalDailyQuestionsLimit: 2000,
    rateLimitRpm: 5,
    maxQuestionsPerRequest: 15,
    timezone: "Asia/Jakarta",
  });

  // Override Modal
  const [editingUser, setEditingUser] = useState<UserQuotaSummary | null>(null);
  const [customQuotaInput, setCustomQuotaInput] = useState<string>("");

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ai/quotas");
      if (!res.ok) {
        throw new Error("Gagal mengambil data manajemen kuota.");
      }
      const json: OverviewData = await res.json();
      setData(json);
      if (json.config) {
        setConfigForm(json.config);
      }
    } catch (err: any) {
      onToast("Error", err?.message || "Gagal memuat overview kuota AI.", "error");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSavingConfig(true);
      const res = await fetch("/api/admin/ai/quotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configForm),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal memperbarui konfigurasi kuota.");
      }
      onToast("Berhasil", "Konfigurasi kuota AI berhasil diperbarui.", "success");
      fetchOverview();
    } catch (err: any) {
      onToast("Gagal", err?.message || "Terjadi kesalahan.", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleEmergency = async () => {
    const nextState = !configForm.emergencyShutdown;
    const confirmMsg = nextState
      ? "PERINGATAN DARURAT: Apakah Anda yakin ingin mengaktifkan Emergency AI Shutdown? Seluruh permintaan pembuatan soal via AI akan langsung diblokir!"
      : "Apakah Anda ingin menonaktifkan Emergency AI Shutdown dan memulihkan operasional Generator AI?";

    if (!window.confirm(confirmMsg)) return;

    try {
      setSavingConfig(true);
      const res = await fetch("/api/admin/ai/quotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...configForm,
          emergencyShutdown: nextState,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Gagal mengubah mode darurat.");
      }
      setConfigForm((prev) => ({ ...prev, emergencyShutdown: nextState }));
      onToast(
        nextState ? "Emergency AI Shutdown Aktif" : "Generator AI Dipulihkan",
        nextState
          ? "Seluruh akses pembuatan soal via AI telah dihentikan segera."
          : "Operasional normal Generator AI telah aktif kembali.",
        nextState ? "error" : "success"
      );
      fetchOverview();
    } catch (err: any) {
      onToast("Gagal", err?.message || "Terjadi kesalahan.", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleGrantAccess = async (user: UserQuotaSummary) => {
    try {
      setActionLoadingId(user.userId);
      const res = await fetch("/api/admin/ai/quotas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grant",
          targetUserId: user.userId,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memberikan izin akses AI.");

      onToast("Akses AI Diberikan", `Izin akses AI untuk ${user.displayName} berhasil diaktifkan.`, "success");
      fetchOverview();
    } catch (err: any) {
      onToast("Gagal", err?.message || "Terjadi kesalahan.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRevokeAccess = async (user: UserQuotaSummary) => {
    if (!window.confirm(`Cabut izin akses Generator AI dari ${user.displayName} (${user.email})?`)) return;

    try {
      setActionLoadingId(user.userId);
      const res = await fetch("/api/admin/ai/quotas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          targetUserId: user.userId,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mencabut izin akses AI.");

      onToast("Akses AI Dicabut", `Izin akses AI dari ${user.displayName} telah dicabut.`, "warning");
      fetchOverview();
    } catch (err: any) {
      onToast("Gagal", err?.message || "Terjadi kesalahan.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveCustomQuota = async () => {
    if (!editingUser) return;
    try {
      setActionLoadingId(editingUser.userId);
      const val = customQuotaInput.trim() === "" ? null : Number(customQuotaInput);
      if (val !== null && (isNaN(val) || val <= 0)) {
        onToast("Validasi Gagal", "Jumlah kuota harus angka positif atau kosong untuk reset default.", "warning");
        return;
      }

      const res = await fetch("/api/admin/ai/quotas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "override",
          targetUserId: editingUser.userId,
          dailyAiQuotaOverride: val,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengatur kuota individual.");

      onToast("Kuota Disimpan", `Kuota harian ${editingUser.displayName} diperbarui menjadi ${val ?? "Default"}.`, "success");
      setEditingUser(null);
      fetchOverview();
    } catch (err: any) {
      onToast("Gagal", err?.message || "Terjadi kesalahan.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = (data?.users || []).filter((u) => {
    const matchSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (accessFilter === "authorized") return u.hasAiAccess;
    if (accessFilter === "unauthorized") return !u.hasAiAccess;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-[#64748B] space-y-3 bg-white rounded-2xl border border-[#E2E8F0]">
        <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
        <p className="text-sm font-semibold">Memuat data akses dan manajemen kuota AI...</p>
      </div>
    );
  }

  const isEmergency = Boolean(configForm.emergencyShutdown);

  return (
    <div className="space-y-6">
      {/* 1. Emergency Alert Banner */}
      {isEmergency && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#FEF2F2] border-2 border-[#DC2626] text-[#991B1B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DC2626] text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#DC2626]">EMERGENCY SHUTDOWN AKTIF</h3>
              <p className="text-xs text-[#7F1D1D]">
                Seluruh generator AI diblokir seketika di tingkat server backend. Tidak ada konsumsi token AI yang dapat diproses hingga mode darurat dinonaktifkan.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleEmergency}
            disabled={savingConfig}
            className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C] transition-all shrink-0 cursor-pointer"
          >
            Matikan Emergency Shutdown
          </button>
        </div>
      )}

      {/* 2. Today's Telemetry & Quota Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Penggunaan Harian Platform */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Generasi Global Hari Ini</span>
            <span className="p-1.5 rounded-lg bg-[#F0FDF4] text-[#16A34A]">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#0F172A]">
              {data?.stats.totalRequestsUsed || 0}
            </span>
            <span className="text-xs text-[#64748B]">/ {configForm.globalDailyLimit} max</span>
          </div>
          <div className="w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#16A34A] h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  (((data?.stats.totalRequestsUsed || 0) + (data?.stats.totalRequestsReserved || 0)) /
                    (configForm.globalDailyLimit || 1)) *
                    100
                )}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-[#64748B]">
            {data?.stats.remainingGlobalRequests ?? 0} kuota tersisa • Reset 00:00 WIB
          </p>
        </div>

        {/* Card 2: Pengguna Diizinkan */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Pengguna Berizin AI</span>
            <span className="p-1.5 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#0F172A]">
              {data?.stats.activeAuthorizedUsersCount || 0}
            </span>
            <span className="text-xs text-[#64748B]">/ {data?.stats.totalUsersCount || 0} akun</span>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Hanya pengguna diizinkan yang dapat melakukan generasi soal AI
          </p>
        </div>

        {/* Card 3: Soal Disintesis */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Butir Soal AI Hari Ini</span>
            <span className="p-1.5 rounded-lg bg-[#FAF5FF] text-[#9333EA]">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-[#0F172A]">
              {data?.stats.totalQuestionsGenerated || 0}
            </span>
            <span className="text-xs text-[#64748B]">butir</span>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Maksimum {configForm.maxQuestionsPerRequest} butir per permintaan
          </p>
        </div>

        {/* Card 4: Status Operasional */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Status Gate AI</span>
            <span
              className={`p-1.5 rounded-lg ${
                isEmergency
                  ? "bg-[#FEF2F2] text-[#DC2626]"
                  : configForm.enabled
                  ? "bg-[#F0FDF4] text-[#16A34A]"
                  : "bg-[#FFFBEB] text-[#D97706]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isEmergency
                  ? "bg-[#DC2626] animate-ping"
                  : configForm.enabled
                  ? "bg-[#16A34A]"
                  : "bg-[#D97706]"
              }`}
            />
            <span className="text-sm font-bold text-[#0F172A]">
              {isEmergency
                ? "Emergency Shutdown"
                : configForm.enabled
                ? "Beroperasi Normal"
                : "AI Dinonaktifkan"}
            </span>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Rate limit: {configForm.rateLimitRpm} req/menit per user
          </p>
        </div>
      </div>

      {/* 3. Global Quota Controls & Emergency Switch Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#F1F5F9]">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#16A34A]" />
              Konfigurasi Kebijakan Kuota AI & Batas Platform
            </h3>
            <p className="text-xs text-[#64748B]">
              Atur batas penggunaan harian, frekuensi rate limit per menit, dan saklar darurat platform NemoLearn.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleEmergency}
              disabled={savingConfig}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                isEmergency
                  ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                  : "bg-[#FFF1F2] border border-[#FECDD3] text-[#BE123C] hover:bg-[#FFE4E6]"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {isEmergency ? "Matikan Shutdown Darurat" : "Emergency AI Shutdown"}
            </button>
            <button
              type="button"
              onClick={() => handleSaveConfig()}
              disabled={savingConfig}
              className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {savingConfig ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Simpan Pengaturan
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Owner Daily Quota:
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={configForm.ownerDailyQuota}
              onChange={(e) =>
                setConfigForm((prev) => ({
                  ...prev,
                  ownerDailyQuota: Math.max(1, Number(e.target.value) || 1),
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Default: 50 generasi/hari</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Default User Daily Quota:
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={configForm.defaultUserDailyQuota}
              onChange={(e) =>
                setConfigForm((prev) => ({
                  ...prev,
                  defaultUserDailyQuota: Math.max(1, Number(e.target.value) || 1),
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Default: 10 generasi/hari</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Global Daily Generation Limit:
            </label>
            <input
              type="number"
              min={10}
              max={5000}
              value={configForm.globalDailyLimit}
              onChange={(e) =>
                setConfigForm((prev) => ({
                  ...prev,
                  globalDailyLimit: Math.max(10, Number(e.target.value) || 10),
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Batas total seluruh platform/hari</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Rate Limit per Menit (RPM):
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={configForm.rateLimitRpm}
              onChange={(e) =>
                setConfigForm((prev) => ({
                  ...prev,
                  rateLimitRpm: Math.max(1, Number(e.target.value) || 1),
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Mencegah spam & flooding (default 5)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Maksimum Soal per Request:
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={configForm.maxQuestionsPerRequest}
              onChange={(e) =>
                setConfigForm((prev) => ({
                  ...prev,
                  maxQuestionsPerRequest: Math.max(1, Number(e.target.value) || 1),
                }))
              }
              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Batas aman inferensi (default 15)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Timezone Operasional:
            </label>
            <div className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-[#0F172A]">
              Asia/Jakarta (WIB) — UTC+07:00
            </div>
            <p className="text-[11px] text-[#64748B] mt-1">Reset kuota otomatis tepat 00:00 WIB</p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configForm.enabled}
                onChange={(e) =>
                  setConfigForm((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16A34A]"></div>
            </label>
            <span className="text-xs font-bold text-[#0F172A]">
              {configForm.enabled ? "Generator AI Aktif" : "Generator AI Dinonaktifkan"}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Authorized Users Management Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#16A34A]" />
              Otorisasi Akses Pengguna & Kuota Individual
            </h3>
            <p className="text-xs text-[#64748B]">
              Secara default, akun publik tidak memiliki izin akses AI hingga disetujui Owner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <div className="flex rounded-xl bg-[#F1F5F9] p-0.5 text-xs font-semibold text-[#475569]">
              <button
                type="button"
                onClick={() => setAccessFilter("all")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  accessFilter === "all" ? "bg-white text-[#0F172A] shadow-xs" : ""
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setAccessFilter("authorized")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  accessFilter === "authorized" ? "bg-white text-[#16A34A] shadow-xs" : ""
                }`}
              >
                Diizinkan
              </button>
              <button
                type="button"
                onClick={() => setAccessFilter("unauthorized")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  accessFilter === "unauthorized" ? "bg-white text-[#DC2626] shadow-xs" : ""
                }`}
              >
                Belum Diizinkan
              </button>
            </div>
          </div>
        </div>

        {/* Table of Users */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9F5] text-[#475569] uppercase font-bold text-[10px] tracking-wider border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Status Izin AI</th>
                <th className="px-3 py-3">Kuota Harian</th>
                <th className="px-3 py-3">Pemakaian Hari Ini</th>
                <th className="px-3 py-3">Sisa Kuota</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] font-medium text-[#1E293B]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#64748B]">
                    Tidak ditemukan pengguna yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isLoadingAction = actionLoadingId === u.userId;
                  return (
                    <tr key={u.userId} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-[#0F172A]">{u.displayName}</div>
                        <div className="text-[11px] text-[#64748B] font-mono">{u.email}</div>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            u.isOwner
                              ? "bg-[#FEF3C7] text-[#B45309]"
                              : u.role === "admin"
                              ? "bg-[#EFF6FF] text-[#1D4ED8]"
                              : u.role === "guru"
                              ? "bg-[#F0FDF4] text-[#15803D]"
                              : "bg-[#F1F5F9] text-[#475569]"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        {u.isOwner ? (
                          <span className="inline-flex items-center gap-1 text-[#15803D] font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Owner (Selalu Aktif)
                          </span>
                        ) : u.hasAiAccess ? (
                          <span className="inline-flex items-center gap-1 text-[#16A34A] font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Diizinkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#94A3B8] text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            Belum Diizinkan
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#0F172A]">
                            {u.effectiveDailyQuota} kali
                          </span>
                          {u.dailyAiQuotaOverride ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FEF3C7] text-[#92400E]">
                              Custom
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#94A3B8]">(Default)</span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-semibold text-[#0F172A]">
                          {u.requestsUsed} digunakan
                          {u.requestsReserved > 0 && (
                            <span className="text-[#D97706] text-[10px] ml-1">
                              (+{u.requestsReserved} reserved)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#64748B]">
                          {u.questionsGenerated} butir soal disintesis
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                            u.remainingQuota === 0
                              ? "bg-[#FEF2F2] text-[#DC2626]"
                              : u.remainingQuota <= 3
                              ? "bg-[#FFFBEB] text-[#D97706]"
                              : "bg-[#F0FDF4] text-[#16A34A]"
                          }`}
                        >
                          {u.remainingQuota} tersisa
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {u.isOwner ? (
                            <span className="text-[10px] text-[#94A3B8] italic">
                              Akses Permanen
                            </span>
                          ) : (
                            <>
                              {u.hasAiAccess ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAccess(u)}
                                  disabled={isLoadingAction}
                                  className="px-2.5 py-1 rounded-lg border border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] font-semibold text-[11px] transition-all cursor-pointer"
                                >
                                  Cabut Izin
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleGrantAccess(u)}
                                  disabled={isLoadingAction}
                                  className="px-2.5 py-1 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-[11px] transition-all cursor-pointer"
                                >
                                  Beri Izin
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser(u);
                                  setCustomQuotaInput(
                                    u.dailyAiQuotaOverride ? String(u.dailyAiQuotaOverride) : ""
                                  );
                                }}
                                disabled={isLoadingAction}
                                className="px-2 py-1 rounded-lg border border-[#CBD5E1] text-[#334155] hover:bg-[#F1F5F9] font-medium text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                                title="Ubah kuota individual"
                              >
                                <Edit2 className="w-3 h-3 text-[#64748B]" />
                                Kuota
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Custom Quota Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-6 space-y-4 animate-scale-in">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#0F172A]">
                Atur Kuota Individual: {editingUser.displayName}
              </h4>
              <p className="text-xs text-[#64748B] font-mono">{editingUser.email}</p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Batas Kuota Harian (generasi/hari):
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  placeholder={`Default (${configForm.defaultUserDailyQuota})`}
                  value={customQuotaInput}
                  onChange={(e) => setCustomQuotaInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-sm font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
                <p className="text-[11px] text-[#64748B] mt-1">
                  Kosongkan input untuk mereset kembali ke kuota default ({configForm.defaultUserDailyQuota} kali/hari).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#475569] space-y-1">
                <div className="flex justify-between">
                  <span>Pemakaian Hari Ini:</span>
                  <span className="font-bold text-[#0F172A]">{editingUser.requestsUsed} kali</span>
                </div>
                <div className="flex justify-between">
                  <span>Reset Harian:</span>
                  <span className="font-mono text-[#16A34A]">00:00 WIB</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveCustomQuota}
                disabled={actionLoadingId === editingUser.userId}
                className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {actionLoadingId === editingUser.userId ? "Menyimpan..." : "Simpan Kuota"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
