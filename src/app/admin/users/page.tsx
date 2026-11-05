"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  Key,
  Eye,
  CheckCircle,
  XCircle,
  School,
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
  Database,
  GraduationCap,
  Clock,
  Briefcase,
  Check,
} from "lucide-react";
import { User, UserRole, AdminPermission } from "@/types/user";
import { AdminContentContainer } from "@/components/admin/AdminContentContainer";
import {
  AdminDataTable,
  ColumnDef,
  AdminFilterBar,
  FilterTabItem,
  AdminModal,
  AdminConfirmDialog,
  toast,
} from "@/components/admin/ui";
import { TeacherVerificationQueue } from "@/components/admin/users/TeacherVerificationQueue";
import { UserDetailModal } from "@/components/admin/users/UserDetailModal";
import { NewUserDrawer } from "@/components/admin/users/NewUserDrawer";
import { AdminPermissionsModal } from "@/components/admin/users/AdminPermissionsModal";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    suspended: number;
    newUsers: number;
    pendingVerification: number;
    byRole: Record<UserRole, number>;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedVerification, setSelectedVerification] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Selected row checkboxes for batch view
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Drawers and Modals
  const [showNewUserDrawer, setShowNewUserDrawer] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);
  const [editRoleUser, setEditRoleUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>("pelajar");

  // Confirm Action Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "suspend" | "activate" | "delete";
    user: User | null;
  }>({
    isOpen: false,
    type: "suspend",
    user: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const showToast = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    if (type === "success") toast.success(title, message);
    else if (type === "error") toast.error(title, message);
    else toast.info(title, message);
  };

  // Load current session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch((err) => console.error("Gagal memuat sesi:", err));
  }, []);

  // Fetch users from API
  const loadUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      role: selectedRole,
      status: selectedStatus,
    });
    if (selectedVerification !== "all") params.set("verificationStatus", selectedVerification);
    if (selectedDateRange !== "all") params.set("dateRange", selectedDateRange);
    if (search.trim()) params.set("search", search.trim());

    fetch(`/api/admin/users?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.users);
          setTotal(data.total);
          setStats(data.stats);
        } else {
          showToast("Gagal Memuat Data", data.error || "Terjadi kesalahan saat memuat pengguna.", "error");
        }
      })
      .catch((err) => {
        showToast("Koneksi Error", "Gagal menghubungi server database.", "error");
      })
      .finally(() => setLoading(false));
  }, [page, limit, selectedRole, selectedStatus, selectedVerification, selectedDateRange, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Tab change handler
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setPage(1);
    switch (tabId) {
      case "all":
        setSelectedRole("all");
        setSelectedStatus("all");
        setSelectedVerification("all");
        break;
      case "pelajar":
        setSelectedRole("pelajar");
        setSelectedStatus("all");
        setSelectedVerification("all");
        break;
      case "guru":
        setSelectedRole("guru");
        setSelectedStatus("all");
        setSelectedVerification("all");
        break;
      case "pending":
        setSelectedRole("guru");
        setSelectedVerification("pending");
        setSelectedStatus("all");
        break;
      case "admin":
        setSelectedRole("admin");
        setSelectedStatus("all");
        setSelectedVerification("all");
        break;
      case "suspended":
        setSelectedRole("all");
        setSelectedStatus("suspended");
        setSelectedVerification("all");
        break;
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setSelectedVerification("all");
    setSelectedDateRange("all");
    setActiveTab("all");
    setPage(1);
  };

  // Export CSV Data
  const handleExportCsv = () => {
    if (users.length === 0) {
      showToast("Tidak Ada Data", "Tidak ada rekaman data pengguna untuk diekspor.", "info");
      return;
    }

    const headers = [
      "ID",
      "Nama Lengkap",
      "Email",
      "Peran (Role)",
      "Institusi/Sekolah",
      "NUPTK",
      "NIP",
      "Mata Pelajaran",
      "Status Akun",
      "Status Verifikasi",
      "Tanggal Registrasi",
      "Aktivitas Terakhir",
    ];

    const rows = users.map((u) => [
      u.id,
      `"${(u.displayName || "").replace(/"/g, '""')}"`,
      u.email,
      u.role,
      `"${(u.school || "").replace(/"/g, '""')}"`,
      u.nuptk || "-",
      u.nip || "-",
      `"${(u.subject || "").replace(/"/g, '""')}"`,
      u.status === "active" ? "Aktif" : "Ditangguhkan",
      u.verificationStatus || "unverified",
      u.createdAt ? new Date(u.createdAt).toISOString() : "-",
      u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : "-",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `nemolearn_users_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Ekspor Berhasil", `${users.length} pengguna berhasil diunduh dalam format CSV.`, "success");
  };

  // Create User Handler
  const handleCreateUser = async (userData: any): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat pengguna.");
      }
      showToast("Pengguna Ditambahkan", `Akun ${data.user.displayName} berhasil diterbitkan.`, "success");
      loadUsers();
      return true;
    } catch (err: any) {
      showToast("Gagal Membuat Pengguna", err.message, "error");
      throw err;
    }
  };

  // Approve Teacher Verification
  const handleApproveTeacher = async (user: User, note?: string) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "verified",
          verificationNote: note || "Kredensial pendidik telah diverifikasi valid oleh Tim Akademik.",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyetujui kredensial guru.");
      }
      showToast("Kredensial Disetujui", `Akun ${user.displayName} resmi disetujui sebagai Pengajar Terverifikasi.`, "success");
      loadUsers();
    } catch (err: any) {
      showToast("Gagal Memproses Verifikasi", err.message, "error");
    }
  };

  // Reject Teacher Verification
  const handleRejectTeacher = async (user: User, note?: string) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "rejected",
          verificationNote: note || "Dokumen kredensial belum memenuhi kualifikasi pengajar.",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menolak kredensial guru.");
      }
      showToast("Permohonan Ditolak", `Pengajuan kredensial ${user.displayName} ditolak.`, "info");
      loadUsers();
    } catch (err: any) {
      showToast("Gagal Memproses Verifikasi", err.message, "error");
    }
  };

  // Update Role Handler
  const handleSaveRole = async () => {
    if (!editRoleUser) return;
    try {
      const res = await fetch(`/api/admin/users/${editRoleUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengubah peran pengguna.");
      }
      showToast("Peran Diperbarui", `Peran ${editRoleUser.displayName} diubah menjadi '${targetRole}'.`, "success");
      setEditRoleUser(null);
      loadUsers();
    } catch (err: any) {
      showToast("Gagal Mengubah Peran", err.message, "error");
    }
  };

  // Update Permissions Handler
  const handleSavePermissions = async (userId: string, permissions: AdminPermission[]) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Gagal memperbarui izin administrator.");
    }
    showToast("Izin Diperbarui", "Hak akses administrator berhasil disinkronisasi.", "success");
    loadUsers();
  };

  // Execute Confirm Dialog (Suspend, Activate, Delete)
  const handleExecuteConfirm = async () => {
    if (!confirmDialog.user) return;
    setConfirmLoading(true);
    const target = confirmDialog.user;

    try {
      if (confirmDialog.type === "delete") {
        const res = await fetch(`/api/admin/users/${target.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Gagal menghapus pengguna.");
        showToast("Pengguna Dihapus", `Akun ${target.displayName} berhasil dihapus dari sistem.`, "info");
      } else {
        const newStatus = confirmDialog.type === "suspend" ? "suspended" : "active";
        const res = await fetch(`/api/admin/users/${target.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Gagal mengubah status akun.");
        showToast(
          newStatus === "suspended" ? "Akun Ditangguhkan" : "Akun Diaktifkan",
          `Status akun ${target.displayName} kini '${newStatus}'.`,
          "success"
        );
      }
      setConfirmDialog({ isOpen: false, type: "suspend", user: null });
      loadUsers();
    } catch (err: any) {
      showToast("Gagal Melakukan Aksi", err.message, "error");
    } finally {
      setConfirmLoading(false);
    }
  };

  // Row selection
  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Pending verification teachers for dedicated queue
  const pendingCandidates = useMemo(() => {
    return users.filter((u) => u.verificationStatus === "pending");
  }, [users]);

  // Filter Tabs
  const filterTabs: FilterTabItem[] = useMemo(() => {
    return [
      { id: "all", label: "Semua Pengguna", count: stats?.total ?? 0 },
      { id: "pelajar", label: "Siswa", count: stats?.byRole?.pelajar ?? 0 },
      { id: "guru", label: "Guru • Pengajar", count: stats?.byRole?.guru ?? 0 },
      {
        id: "pending",
        label: "Menunggu Verifikasi",
        count: stats?.pendingVerification ?? 0,
        badgeVariant: "coral",
      },
      {
        id: "admin",
        label: "Administrator",
        count: (stats?.byRole?.admin || 0) + (stats?.byRole?.owner || 0),
      },
      {
        id: "suspended",
        label: "Ditangguhkan",
        count: stats?.suspended ?? 0,
        badgeVariant: "coral",
      },
    ];
  }, [stats]);

  // Table Columns Definition
  const columns: ColumnDef<User>[] = useMemo(() => {
    return [
      {
        key: "checkbox",
        header: (
          <input
            type="checkbox"
            checked={users.length > 0 && selectedUserIds.length === users.length}
            onChange={handleToggleSelectAll}
            className="rounded border-[#D0D5DD] text-[#0B559F] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
          />
        ),
        align: "center",
        className: "w-8",
        render: (user) => (
          <input
            type="checkbox"
            checked={selectedUserIds.includes(user.id)}
            onChange={() => handleToggleSelectUser(user.id)}
            className="rounded border-[#D0D5DD] text-[#0B559F] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
          />
        ),
      },
      {
        key: "identity",
        header: "Identitas Pengguna",
        render: (user) => {
          const initials = user.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                  user.role === "owner"
                    ? "bg-[#53389E] text-white"
                    : user.role === "admin"
                    ? "bg-[#0B559F] text-white"
                    : user.role === "guru"
                    ? "bg-[#E8F8F2] text-[#027A48] border border-[#A6F4C5]"
                    : "bg-[#EEF3F9] text-[#0B559F]"
                }`}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-[#101828] flex items-center gap-1.5 truncate">
                  <span className="truncate">{user.displayName}</span>
                  {user.verificationStatus === "verified" && (
                    <span title="Akun Terverifikasi">
                      <CheckCircle className="w-3.5 h-3.5 text-[#0FA97A] shrink-0" />
                    </span>
                  )}
                  {user.verificationStatus === "pending" && (
                    <span className="w-2 h-2 rounded-full bg-[#F79009] animate-pulse shrink-0" title="Menunggu Verifikasi" />
                  )}
                </div>
                <div className="text-[11px] font-mono text-[#667085] truncate">
                  {user.email}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "role",
        header: "Role Privilege",
        render: (user) => {
          const isOwner = user.role === "owner";
          const isAdmin = user.role === "admin";
          const isGuru = user.role === "guru";

          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium font-mono ${
                isOwner
                  ? "bg-[#53389E]/10 text-[#53389E] border border-[#53389E]/20 font-bold"
                  : isAdmin
                  ? "bg-[#0B559F]/10 text-[#0B559F] border border-[#0B559F]/20 font-bold"
                  : isGuru
                  ? "bg-[#E8F8F2] text-[#027A48] border border-[#A6F4C5]"
                  : "bg-[#EEF3F9] text-[#475467] border border-[#D0D5DD]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOwner
                    ? "bg-[#53389E]"
                    : isAdmin
                    ? "bg-[#0B559F]"
                    : isGuru
                    ? "bg-[#0FA97A]"
                    : "bg-[#667085]"
                }`}
              />
              <span className="capitalize">{user.role}</span>
            </span>
          );
        },
      },
      {
        key: "institution",
        header: "Institusi Pendidikan",
        render: (user) => (
          <div className="min-w-0">
            <div className="text-xs text-[#101828] font-medium truncate max-w-[200px]">
              {user.school || "Belum dicatat"}
            </div>
            {(user.nuptk || user.nip) && (
              <div className="text-[10px] text-[#667085] font-mono truncate">
                {user.nuptk ? `NUPTK: ${user.nuptk}` : `NIP: ${user.nip}`}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "createdAt",
        header: "Tanggal Gabung",
        render: (user) => (
          <span className="font-mono text-[11px] text-[#475467]">
            {new Date(user.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status Akun",
        render: (user) => (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
              user.status === "active"
                ? "bg-[#E8F8F2] text-[#027A48]"
                : "bg-[#FEE4E2] text-[#D92D20]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                user.status === "active" ? "bg-[#0FA97A]" : "bg-[#D92D20]"
              }`}
            />
            {user.status === "active" ? "Aktif" : "Ditangguhkan"}
          </span>
        ),
      },
      {
        key: "lastActive",
        header: "Aktivitas Terakhir",
        render: (user) => (
          <span className="font-mono text-[11px] text-[#667085]">
            {user.lastActiveAt
              ? new Date(user.lastActiveAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Aksi Cepat",
        align: "right",
        render: (user) => {
          const isCurrentUser = user.id === currentUser?.id;
          const isOwnerUser = user.role === "owner";
          const isAdminUser = user.role === "admin";
          const isOwnerActor = currentUser?.role === "owner";

          const canManagePermissions = isOwnerActor && isAdminUser;
          const canEditRole = isOwnerActor || (!isOwnerUser && !isAdminUser);
          const canToggleStatus = !isCurrentUser && !isOwnerUser && (isOwnerActor || !isAdminUser);
          const canDelete = !isCurrentUser && !isOwnerUser && (isOwnerActor || !isAdminUser);

          return (
            <div className="inline-flex items-center gap-1">
              {/* View Detail Button */}
              <button
                type="button"
                onClick={() => setDetailUser(user)}
                className="p-1.5 rounded-lg text-[#475467] hover:text-[#0B559F] hover:bg-[#EEF3F9] transition-colors"
                title="Lihat Detail Profil & Sesi"
              >
                <Eye className="w-4 h-4" />
              </button>

              {/* Manage Permissions (Owner only for Admin) */}
              {canManagePermissions && (
                <button
                  type="button"
                  onClick={() => setPermissionsUser(user)}
                  className="p-1.5 rounded-lg text-[#0B559F] hover:bg-[#EEF3F9] transition-colors"
                  title="Kelola Izin Administrator"
                >
                  <Key className="w-4 h-4" />
                </button>
              )}

              {/* Edit Role Button */}
              {canEditRole && (
                <button
                  type="button"
                  onClick={() => {
                    setEditRoleUser(user);
                    setTargetRole(user.role);
                  }}
                  className="p-1.5 rounded-lg text-[#475467] hover:text-[#101828] hover:bg-[#EEF3F9] transition-colors"
                  title="Ubah Peran (Role)"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}

              {/* Suspend / Activate Toggle */}
              {canToggleStatus && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      type: user.status === "active" ? "suspend" : "activate",
                      user,
                    })
                  }
                  className={`p-1.5 rounded-lg transition-colors ${
                    user.status === "active"
                      ? "text-[#D92D20] hover:bg-[#FEE4E2]"
                      : "text-[#0FA97A] hover:bg-[#E8F8F2]"
                  }`}
                  title={user.status === "active" ? "Tangguhkan Akun" : "Aktifkan Akun"}
                >
                  {user.status === "active" ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Delete User */}
              {canDelete && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      type: "delete",
                      user,
                    })
                  }
                  className="p-1.5 rounded-lg text-[#667085] hover:text-[#D92D20] hover:bg-[#FEE4E2] transition-colors"
                  title="Hapus Akun Pengguna"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ];
  }, [users, selectedUserIds, currentUser]);

  return (
    <AdminContentContainer
      subsystemTag="DIR_ACCESS_V2"
      pulseLive={true}
      breadcrumbItems={[
        { label: "Admin", href: "/admin" },
        { label: "Manajemen Pengguna & Hak Akses" },
      ]}
    >
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#E8F1FC] text-[#0B559F] font-semibold border border-[#B2D0F7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B559F] animate-pulse" />
              DIR_ACCESS_V2
            </span>
            <span className="text-xs font-mono text-[#53389E]">/ IAM &amp; Directory Node</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#101828] font-['Plus_Jakarta_Sans']">
            Manajemen Pengguna &amp; Hak Akses
          </h1>
          <p className="text-xs sm:text-sm text-[#475467] max-w-2xl leading-relaxed">
            Kelola direktori siswa, verifikasi kredensial pengajar, atur role privilege, dan pantau anomali status akun platform skala nasional.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#344054] border border-[#D0D5DD] shadow-xs text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4 text-[#667085] group-hover:text-[#0B559F] transition-colors" />
            <span>Export CSV Data</span>
          </button>
          <button
            type="button"
            onClick={() => setShowNewUserDrawer(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B559F] text-white hover:bg-[#083E75] shadow-sm text-xs font-semibold transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Bento Row (6 Cards from Stitch Reference) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Card 1: Semua Pengguna */}
        <div
          onClick={() => handleTabChange("all")}
          className="bg-white border border-[#E2E8F0] hover:border-[#B2D0F7] rounded-xl p-3.5 shadow-sapphire-card transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              Semua Pengguna
            </span>
            <Database className="w-4 h-4 text-[#667085] group-hover:text-[#0B559F] transition-colors" />
          </div>
          <div className="text-xl font-bold text-[#101828] font-['Plus_Jakarta_Sans']">
            {stats?.total ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-[#0FA97A] font-mono flex items-center gap-0.5">
            +{stats?.newUsers ?? 0} baru (30h)
          </div>
        </div>

        {/* Card 2: Siswa Aktif */}
        <div
          onClick={() => handleTabChange("pelajar")}
          className="bg-white border border-[#E2E8F0] hover:border-[#B2D0F7] rounded-xl p-3.5 shadow-sapphire-card transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              Siswa Aktif
            </span>
            <GraduationCap className="w-4 h-4 text-[#667085] group-hover:text-[#0B559F] transition-colors" />
          </div>
          <div className="text-xl font-bold text-[#101828] font-['Plus_Jakarta_Sans']">
            {stats?.byRole?.pelajar ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-[#667085] font-mono">
            {stats?.total ? `${((stats.byRole.pelajar / stats.total) * 100).toFixed(1)}% platform share` : "-"}
          </div>
        </div>

        {/* Card 3: Guru & Dosen */}
        <div
          onClick={() => handleTabChange("guru")}
          className="bg-white border border-[#E2E8F0] hover:border-[#B2D0F7] rounded-xl p-3.5 shadow-sapphire-card transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              Guru &amp; Dosen
            </span>
            <Briefcase className="w-4 h-4 text-[#667085] group-hover:text-[#0FA97A] transition-colors" />
          </div>
          <div className="text-xl font-bold text-[#101828] font-['Plus_Jakarta_Sans']">
            {stats?.byRole?.guru ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-[#0FA97A] font-mono">
            Terverifikasi NUPTK
          </div>
        </div>

        {/* Card 4: Verifikasi Guru */}
        <div
          onClick={() => handleTabChange("pending")}
          className="bg-gradient-to-br from-[#FFFFFF] to-[#E8F1FC] border border-[#B2D0F7] rounded-xl p-3.5 shadow-sapphire-card transition-all cursor-pointer group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-[#0B559F] mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
              Verifikasi Guru
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0B559F] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0B559F]" />
            </span>
          </div>
          <div className="text-xl font-bold text-[#0B559F] font-['Plus_Jakarta_Sans']">
            {stats?.pendingVerification ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-[#0B559F] font-mono font-medium">
            Perlu tinjauan kredensial
          </div>
        </div>

        {/* Card 5: Administrator */}
        <div
          onClick={() => handleTabChange("admin")}
          className="bg-white border border-[#E2E8F0] hover:border-[#B2D0F7] rounded-xl p-3.5 shadow-sapphire-card transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              Administrator
            </span>
            <ShieldCheck className="w-4 h-4 text-[#667085] group-hover:text-[#53389E] transition-colors" />
          </div>
          <div className="text-xl font-bold text-[#101828] font-['Plus_Jakarta_Sans']">
            {(stats?.byRole?.admin || 0) + (stats?.byRole?.owner || 0)}
          </div>
          <div className="mt-1 text-[10px] text-[#53389E] font-mono">
            Super &amp; Regional Admins
          </div>
        </div>

        {/* Card 6: Nonaktif */}
        <div
          onClick={() => handleTabChange("suspended")}
          className="bg-white border border-[#E2E8F0] hover:border-[#FECDCA] rounded-xl p-3.5 shadow-sapphire-card transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-[#667085] mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              Nonaktif
            </span>
            <XCircle className="w-4 h-4 text-[#667085] group-hover:text-[#D92D20] transition-colors" />
          </div>
          <div className="text-xl font-bold text-[#D92D20] font-['Plus_Jakarta_Sans']">
            {stats?.suspended ?? 0}
          </div>
          <div className="mt-1 text-[10px] text-[#D92D20] font-mono">
            Ditangguhkan sistem
          </div>
        </div>
      </div>

      {/* Teacher Verification Queue Banner (When pending candidates exist) */}
      {pendingCandidates.length > 0 && (
        <TeacherVerificationQueue
          candidates={pendingCandidates}
          onApprove={handleApproveTeacher}
          onReject={handleRejectTeacher}
          onViewAll={() => handleTabChange("pending")}
          loading={loading}
        />
      )}

      {/* Filter Bar with Category Tabs and Filter Inputs */}
      <AdminFilterBar
        tabs={filterTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        statusIndicator={
          <span className="flex items-center gap-1.5 text-xs text-[#0FA97A] font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-[#0FA97A] animate-pulse" />
            Live DB Sync
          </span>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-2">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama, email, NUPTK, institusi..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#0B559F] focus:ring-1 focus:ring-[#0B559F] font-mono"
            />
          </div>

          {/* Role Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:border-[#0B559F]"
            >
              <option value="all">Semua Peran (Role: All)</option>
              <option value="pelajar">Siswa (Pelajar)</option>
              <option value="guru">Guru (Pendidik)</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Administrator</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:border-[#0B559F]"
            >
              <option value="all">Status: Semua</option>
              <option value="active">Aktif (Active)</option>
              <option value="suspended">Ditangguhkan</option>
            </select>
          </div>

          {/* Date Range Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedDateRange}
              onChange={(e) => {
                setSelectedDateRange(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:border-[#0B559F]"
            >
              <option value="all">Semua Waktu</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="90d">3 Bulan Terakhir</option>
              <option value="1y">1 Tahun Terakhir</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="lg:col-span-1 flex items-center justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full h-full py-2 px-2.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF3F9] text-[#475467] hover:text-[#101828] border border-[#D0D5DD] flex items-center justify-center transition-colors"
              title="Reset Filter"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </AdminFilterBar>

      {/* Main Users Data Table */}
      <AdminDataTable
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        isLoading={loading}
        currentPage={page}
        totalPages={Math.ceil(total / limit) || 1}
        totalItems={total}
        pageSize={limit}
        onPageChange={(p) => setPage(p)}
        emptyMessage="Pengguna Tidak Ditemukan"
        emptySubtitle="Tidak ada rekaman pengguna yang cocok dengan kueri pencarian atau filter saat ini."
      />

      {/* Slide-over Drawer: New User Creation */}
      <NewUserDrawer
        isOpen={showNewUserDrawer}
        onClose={() => setShowNewUserDrawer(false)}
        onSubmit={handleCreateUser}
        currentUser={currentUser}
      />

      {/* User Detail & Stats Modal */}
      <UserDetailModal
        isOpen={Boolean(detailUser)}
        onClose={() => setDetailUser(null)}
        user={detailUser}
        currentUser={currentUser}
        onEditRole={(u) => {
          setDetailUser(null);
          setEditRoleUser(u);
          setTargetRole(u.role);
        }}
        onManagePermissions={(u) => {
          setDetailUser(null);
          setPermissionsUser(u);
        }}
        onToggleStatus={(u) => {
          setDetailUser(null);
          setConfirmDialog({
            isOpen: true,
            type: u.status === "active" ? "suspend" : "activate",
            user: u,
          });
        }}
      />

      {/* Admin Permissions Modal (Owner only) */}
      <AdminPermissionsModal
        isOpen={Boolean(permissionsUser)}
        onClose={() => setPermissionsUser(null)}
        user={permissionsUser}
        onSave={handleSavePermissions}
      />

      {/* Edit Role Modal */}
      {editRoleUser && (
        <AdminModal
          isOpen={Boolean(editRoleUser)}
          onClose={() => setEditRoleUser(null)}
          title="Ubah Peran Pengguna"
          description={`Tentukan tingkat hak akses baru untuk ${editRoleUser.displayName}`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC]">
              <span className="text-[10px] font-mono uppercase text-[#667085] block">
                Akun Sasaran:
              </span>
              <span className="text-xs font-bold text-[#101828] block">
                {editRoleUser.displayName} ({editRoleUser.email})
              </span>
              <span className="text-[11px] text-[#475467] block mt-0.5">
                Peran saat ini: <strong className="uppercase">{editRoleUser.role}</strong>
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#344054]">
                Pilih Peran Baru:
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:border-[#0B559F]"
              >
                <option value="pelajar">Pelajar / Siswa</option>
                <option value="guru">Guru / Pendidik</option>
                <option value="moderator">Moderator Konten</option>
                {currentUser?.role === "owner" && <option value="admin">Administrator</option>}
                {currentUser?.role === "owner" && <option value="owner">Owner (Superadmin)</option>}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAECF0]">
              <button
                type="button"
                onClick={() => setEditRoleUser(null)}
                className="px-4 py-2 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF3F9] text-[#344054] text-xs font-semibold border border-[#D0D5DD] transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                className="px-4 py-2 rounded-lg bg-[#0B559F] hover:bg-[#083E75] text-white text-xs font-semibold transition-all shadow-sm"
              >
                Simpan Peran
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Confirmation Dialog (Suspend / Activate / Delete) */}
      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: "suspend", user: null })}
        onConfirm={handleExecuteConfirm}
        title={
          confirmDialog.type === "delete"
            ? "Hapus Akun Pengguna"
            : confirmDialog.type === "suspend"
            ? "Tangguhkan Akun Pengguna"
            : "Aktifkan Kembali Akun"
        }
        message={
          confirmDialog.type === "delete"
            ? `Apakah Anda yakin ingin menghapus permanen akun ${confirmDialog.user?.displayName}? Tindakan ini akan dicatat ke dalam audit log dan tidak dapat dibatalkan.`
            : confirmDialog.type === "suspend"
            ? `Apakah Anda yakin ingin menangguhkan akun ${confirmDialog.user?.displayName}? Pengguna tidak akan dapat masuk ke sistem selama status ditangguhkan.`
            : `Apakah Anda ingin mengaktifkan kembali akun ${confirmDialog.user?.displayName}?`
        }
        confirmLabel={
          confirmDialog.type === "delete"
            ? "Hapus Pengguna"
            : confirmDialog.type === "suspend"
            ? "Tangguhkan"
            : "Aktifkan Akun"
        }
        cancelLabel="Batal"
        variant={confirmDialog.type === "activate" ? "success" : "danger"}
        isLoading={confirmLoading}
      />
    </AdminContentContainer>
  );
}
