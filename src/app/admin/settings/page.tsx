"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminContentContainer } from "@/components/admin/AdminContentContainer";
import { AdminConfirmDialog } from "@/components/admin/ui/AdminConfirmDialog";
import { toast, AdminToastContainer } from "@/components/admin/ui/AdminToast";
import { SettingsHeader } from "@/components/admin/settings/SettingsHeader";
import { SettingsTabNav, SettingsTabId } from "@/components/admin/settings/SettingsTabNav";
import { SettingsTabGeneral } from "@/components/admin/settings/SettingsTabGeneral";
import { SettingsTabAi } from "@/components/admin/settings/SettingsTabAi";
import { SettingsTabRateLimits } from "@/components/admin/settings/SettingsTabRateLimits";
import { SettingsTabMaintenance } from "@/components/admin/settings/SettingsTabMaintenance";
import { SettingsTabBroadcast } from "@/components/admin/settings/SettingsTabBroadcast";
import { SettingsTabSecurity } from "@/components/admin/settings/SettingsTabSecurity";
import {
  WebsiteSettings,
  MaskedApiVaultItem,
  GovernanceLogItem,
} from "@/types/settings";
import {
  Loader2,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [apiVault, setApiVault] = useState<MaskedApiVaultItem[]>([]);
  const [governanceLogs, setGovernanceLogs] = useState<GovernanceLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTabId>("tab-ai");
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Load initial settings from server
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.status === 401) {
        setAccessDenied("Sesi Anda telah kedaluwarsa. Silakan masuk kembali.");
        return;
      }
      if (res.status === 403) {
        setAccessDenied("Akses ditolak. Anda tidak memiliki izin untuk mengelola pengaturan sistem.");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gagal memuat konfigurasi sistem.");
      }

      if (data.settings) setSettings(data.settings);
      if (data.apiVault) setApiVault(data.apiVault);
      if (data.governanceLogs) setGovernanceLogs(data.governanceLogs);
    } catch (err: any) {
      toast.error(err.message || "Gagal memuat data pengaturan sistem.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle local state partial updates
  const handleSettingsChange = (partial: Partial<WebsiteSettings>) => {
    if (!settings) return;
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  // Save changes to backend
  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gagal menyimpan konfigurasi sistem.");
      }

      setSettings(data.settings);
      if (data.apiVault) setApiVault(data.apiVault);
      if (data.governanceLogs) setGovernanceLogs(data.governanceLogs);

      toast.success(
        "Konfigurasi Berhasil Disimpan",
        "Parameter langsung disinkronkan ke seluruh edge nodes dan database."
      );
    } catch (err: any) {
      toast.error("Gagal Menyimpan", err.message || "Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  // Reset to platform defaults
  const handleConfirmReset = async () => {
    setSaving(true);
    setConfirmResetOpen(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_defaults" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gagal mengembalikan ke default.");
      }

      setSettings(data.settings);
      if (data.apiVault) setApiVault(data.apiVault);
      if (data.governanceLogs) setGovernanceLogs(data.governanceLogs);

      toast.success(
        "Konfigurasi Direset",
        "Seluruh parameter routing, kuota, dan sistem telah dikembalikan ke nilai awal platform."
      );
    } catch (err: any) {
      toast.error("Gagal Reset", err.message || "Tidak dapat mereset konfigurasi.");
    } finally {
      setSaving(false);
    }
  };

  // Publish broadcast banner immediately
  const handlePublishBroadcast = async () => {
    if (!settings) return;
    const updatedBroadcast = { ...settings.broadcast, active: true };
    const updatedSettings = { ...settings, broadcast: updatedBroadcast };
    setSettings(updatedSettings);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal menyiarkan pengumuman.");

      setSettings(data.settings);
      if (data.governanceLogs) setGovernanceLogs(data.governanceLogs);
      toast.success("Siaran Aktif", "Pengumuman global berhasil disiarkan ke siswa & guru!");
    } catch (err: any) {
      toast.error("Gagal Menyiarkan", err.message);
    }
  };

  // Withdraw broadcast banner
  const handleWithdrawBroadcast = async () => {
    if (!settings) return;
    const updatedBroadcast = { ...settings.broadcast, active: false };
    const updatedSettings = { ...settings, broadcast: updatedBroadcast };
    setSettings(updatedSettings);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal menarik siaran.");

      setSettings(data.settings);
      if (data.governanceLogs) setGovernanceLogs(data.governanceLogs);
      toast.info("Siaran Ditarik", "Banner pengumuman global dinonaktifkan dari peredaran.");
    } catch (err: any) {
      toast.error("Gagal Menarik Siaran", err.message);
    }
  };

  // Download Audit Log JSON
  const handleDownloadAuditLogs = () => {
    window.open("/api/admin/settings/audit-export", "_blank");
  };

  // Loading state
  if (loading) {
    return (
      <AdminContentContainer
        breadcrumbItems={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pengaturan Sistem" },
        ]}
        subsystemTag="Governance Engine // Build 04.92.11 // Cluster-Jakarta"
      >
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-mono text-slate-500">
            Memuat konfigurasi tata kelola sistem NemoLearn...
          </p>
        </div>
      </AdminContentContainer>
    );
  }

  // Access denied state
  if (accessDenied) {
    return (
      <AdminContentContainer
        breadcrumbItems={[
          { label: "Dashboard", href: "/admin" },
          { label: "Pengaturan Sistem" },
        ]}
      >
        <div className="p-8 rounded-xl bg-white border border-red-200 shadow-sm max-w-xl mx-auto text-center space-y-4 my-12">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Akses Ditolak</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{accessDenied}</p>
        </div>
      </AdminContentContainer>
    );
  }

  if (!settings) return null;

  return (
    <AdminContentContainer
      breadcrumbItems={[
        { label: "Dashboard", href: "/admin" },
        { label: "System Settings & Governance" },
      ]}
      subsystemTag="Governance Engine // Build 04.92.11 // Cluster-Jakarta"
      pulseLive={true}
    >
      <AdminToastContainer />

      <div className="space-y-6">
        {/* Settings Header with Ambient Banner & Global Actions */}
        <SettingsHeader
          buildNumber={settings.appInfo?.buildNumber || "04.92.11"}
          clusterId={settings.appInfo?.clusterId || "Cluster-Jakarta"}
          broadcast={settings.broadcast}
          onResetDefaults={() => setConfirmResetOpen(true)}
          onSave={handleSave}
          saving={saving}
          onNavigateToBroadcastTab={() => setActiveTab("tab-broadcast")}
        />

        {/* Tab Navigation */}
        <SettingsTabNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          maintenanceActive={Boolean(settings.maintenance?.enabled)}
          broadcastActive={Boolean(settings.broadcast?.active)}
        />

        {/* Main Tabbed Content */}
        <div className="pt-2">
          {activeTab === "tab-general" && (
            <SettingsTabGeneral
              settings={settings}
              onChange={handleSettingsChange}
            />
          )}

          {activeTab === "tab-ai" && (
            <SettingsTabAi
              settings={settings}
              apiVault={apiVault}
              onChange={handleSettingsChange}
              onRefreshApiVault={fetchSettings}
            />
          )}

          {activeTab === "tab-ratelimit" && (
            <SettingsTabRateLimits
              settings={settings}
              onChange={handleSettingsChange}
            />
          )}

          {activeTab === "tab-maintenance" && (
            <SettingsTabMaintenance
              settings={settings}
              onChange={handleSettingsChange}
            />
          )}

          {activeTab === "tab-broadcast" && (
            <SettingsTabBroadcast
              settings={settings}
              onChange={handleSettingsChange}
              onPublish={handlePublishBroadcast}
              onWithdraw={handleWithdrawBroadcast}
            />
          )}

          {activeTab === "tab-security" && (
            <SettingsTabSecurity
              settings={settings}
              governanceLogs={governanceLogs}
              onChange={handleSettingsChange}
              onDownloadAuditLogs={handleDownloadAuditLogs}
            />
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleConfirmReset}
        title="Kembalikan ke Konfigurasi Default?"
        message="Tindakan ini akan mengembalikan seluruh parameter routing model, suhu generator, kuota rate limiting, dan isolasi pemeliharaan ke nilai awal pabrikan platform. Kunci API yang tersimpan tidak akan terhapus."
        confirmLabel="Ya, Reset ke Default"
        cancelLabel="Batal"
        variant="warning"
      />
    </AdminContentContainer>
  );
}
