"use client";

import React, { useEffect, useState } from "react";
import {
  User as UserIcon,
  Mail,
  School,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  Key,
  BookOpen,
  Activity,
  Copy,
  Check,
} from "lucide-react";
import { User, UserRole } from "@/types/user";
import { UserLearningStats } from "@/types/admin";
import { AdminModal } from "@/components/admin/ui/AdminModal";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentUser: User | null;
  onEditRole?: (user: User) => void;
  onManagePermissions?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  currentUser,
  onEditRole,
  onManagePermissions,
  onToggleStatus,
}) => {
  const [stats, setStats] = useState<UserLearningStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id) {
      setLoadingStats(true);
      fetch(`/api/admin/users/${user.id}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.stats) {
            setStats(data.stats);
          }
        })
        .catch((err) => console.error("Gagal memuat statistik pengguna:", err))
        .finally(() => setLoadingStats(false));
    } else {
      setStats(null);
    }
  }, [isOpen, user?.id]);

  if (!user) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isOwner = currentUser?.role === "owner";
  const canManageRole = isOwner || (user.role !== "admin" && user.role !== "owner");
  const canManagePermissions = isOwner && user.role === "admin";
  const canToggleStatus =
    user.id !== currentUser?.id &&
    user.role !== "owner" &&
    (isOwner || user.role !== "admin");

  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Profil & Rekam Jejak Pengguna"
      description={`Informasi akun dan riwayat aktivitas ${user.displayName}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* User Hero Card */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B559F] to-[#53389E] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#101828] font-['Plus_Jakarta_Sans']">
                  {user.displayName}
                </h3>
                {user.verificationStatus === "verified" && (
                  <span title="Terverifikasi">
                    <CheckCircle className="w-4 h-4 text-[#0FA97A]" />
                  </span>
                )}
              </div>
              <p className="text-xs text-[#475467] font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Badge */}
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider font-mono ${
                user.role === "owner"
                  ? "bg-[#53389E] text-white"
                  : user.role === "admin"
                  ? "bg-[#0B559F] text-white"
                  : user.role === "guru"
                  ? "bg-[#E8F8F2] text-[#027A48] border border-[#A6F4C5]"
                  : "bg-[#EEF3F9] text-[#0B559F] border border-[#B2D0F7]"
              }`}
            >
              {user.role}
            </span>

            {/* Status Badge */}
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                user.status === "active"
                  ? "bg-[#E8F8F2] text-[#027A48]"
                  : "bg-[#FEE4E2] text-[#D92D20]"
              }`}
            >
              {user.status === "active" ? "Aktif" : "Ditangguhkan"}
            </span>
          </div>
        </div>

        {/* Identity & Educational Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#EAECF0]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] flex items-center justify-between">
              <span>ID Pengguna</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-[#0B559F] hover:text-[#083E75] transition-colors"
                title="Salin ID"
              >
                {copiedId ? <Check className="w-3 h-3 text-[#0FA97A]" /> : <Copy className="w-3 h-3" />}
              </button>
            </span>
            <span className="text-xs font-mono font-bold text-[#101828] mt-0.5 block truncate">
              {user.id}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#EAECF0]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] block">
              Asal Sekolah / Institusi
            </span>
            <span className="text-xs font-semibold text-[#101828] mt-0.5 block truncate">
              {user.school || "Tidak terdaftar"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#EAECF0]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] block">
              Nomor Induk (NUPTK/NIP)
            </span>
            <span className="text-xs font-mono font-semibold text-[#101828] mt-0.5 block truncate">
              {user.nuptk || user.nip || "-"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#EAECF0]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] block">
              Tanggal Bergabung
            </span>
            <span className="text-xs font-mono text-[#101828] mt-0.5 block">
              {new Date(user.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#EAECF0]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] block">
              Aktivitas Terakhir
            </span>
            <span className="text-xs font-mono text-[#101828] mt-0.5 block">
              {user.lastActiveAt
                ? new Date(user.lastActiveAt).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Belum tercatat"}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#EAECF0]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] block">
              Status Verifikasi
            </span>
            <span
              className={`text-xs font-bold mt-0.5 block ${
                user.verificationStatus === "verified"
                  ? "text-[#027A48]"
                  : user.verificationStatus === "pending"
                  ? "text-[#B54708]"
                  : "text-[#667085]"
              }`}
            >
              {user.verificationStatus === "verified"
                ? "Terverifikasi Resmi"
                : user.verificationStatus === "pending"
                ? "Menunggu Validasi"
                : "Belum Diverifikasi"}
            </span>
          </div>
        </div>

        {/* Learning Performance & Quiz Statistics */}
        <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#EAECF0] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#101828] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#0B559F]" />
              Rekam Jejak Belajar &amp; Latihan
            </h4>
            {loadingStats && (
              <span className="text-[11px] font-mono text-[#667085] animate-pulse">
                Memuat data...
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-center">
              <span className="text-[10px] font-mono uppercase text-[#667085] block">
                Total Sesi
              </span>
              <span className="text-lg font-bold text-[#101828] font-['Plus_Jakarta_Sans']">
                {stats?.totalSessions ?? 0}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-center">
              <span className="text-[10px] font-mono uppercase text-[#667085] block">
                Selesai
              </span>
              <span className="text-lg font-bold text-[#0FA97A] font-['Plus_Jakarta_Sans']">
                {stats?.completedSessions ?? 0}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E4E7EC] text-center">
              <span className="text-[10px] font-mono uppercase text-[#667085] block">
                Rata-Rata Skor
              </span>
              <span className="text-lg font-bold text-[#0B559F] font-['Plus_Jakarta_Sans']">
                {stats?.avgScoreFormatted || "-"}
              </span>
            </div>
          </div>

          {/* Recent Quiz Sessions Table / List */}
          {stats?.recentSessions && stats.recentSessions.length > 0 ? (
            <div className="space-y-1.5 pt-2 border-t border-[#F2F4F7]">
              <span className="text-[11px] font-semibold text-[#475467] block">
                Riwayat Sesi Terakhir:
              </span>
              <div className="divide-y divide-[#F2F4F7] text-xs">
                {stats.recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#667085]" />
                      <span className="font-medium text-[#101828]">
                        {session.subjectName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#667085] font-mono text-[11px]">
                        {new Date(session.startedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="font-mono font-bold text-[#0B559F]">
                        {session.scoreFormatted || "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-[#667085] italic">
              Belum ada riwayat pengerjaan kuis atau latihan.
            </div>
          )}
        </div>

        {/* Permissions for Admin */}
        {user.role === "admin" && user.permissions && (
          <div className="p-3.5 rounded-xl bg-[#EEF3F9] border border-[#B2D0F7] space-y-2">
            <span className="text-xs font-bold text-[#0B559F] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              Izin Akses Administrator ({user.permissions.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {user.permissions.map((perm) => (
                <span
                  key={perm}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#FFFFFF] text-[#0B559F] border border-[#B2D0F7]"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#EAECF0]">
          <div className="flex items-center gap-2">
            {canToggleStatus && onToggleStatus && (
              <button
                type="button"
                onClick={() => onToggleStatus(user)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  user.status === "active"
                    ? "bg-[#FEE4E2] hover:bg-[#FECDCA] text-[#D92D20]"
                    : "bg-[#E8F8F2] hover:bg-[#D1FADF] text-[#027A48]"
                }`}
              >
                {user.status === "active" ? "Tangguhkan Akun" : "Aktifkan Akun"}
              </button>
            )}

            {canManagePermissions && onManagePermissions && (
              <button
                type="button"
                onClick={() => onManagePermissions(user)}
                className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF3F9] text-[#0B559F] border border-[#D0D5DD] text-xs font-semibold transition-all"
              >
                Kelola Izin
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canManageRole && onEditRole && (
              <button
                type="button"
                onClick={() => onEditRole(user)}
                className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF3F9] text-[#344054] border border-[#D0D5DD] text-xs font-semibold transition-all"
              >
                Ubah Peran
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#0B559F] text-white hover:bg-[#083E75] text-xs font-semibold transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </AdminModal>
  );
};
