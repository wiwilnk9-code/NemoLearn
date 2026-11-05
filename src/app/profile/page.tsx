"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "@/types/user";
import {
  User as UserIcon,
  School,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  Trash2,
  AlertTriangle,
  X,
  FileText,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [school, setSchool] = useState("");
  const [gender, setGender] = useState<"laki-laki" | "perempuan" | "rahasia">("rahasia");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State untuk Modal Hapus Akun
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          setDisplayName(data.user.displayName || "");
          setSchool(data.user.school || "");
          setGender(data.user.gender || "rahasia");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, school, gender }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gagal memperbarui profil.");
      }

      setUser(data.user);
      setSuccessMsg("Profil Anda berhasil diperbarui.");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: deletePassword,
          confirmationText: deleteConfirmationText,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gagal menghapus akun.");
      }

      // Akun berhasil dihapus, redirect ke login dengan query parameter konfirmasi
      router.push("/login?deleted=true");
    } catch (err: any) {
      setDeleteError(err.message || "Gagal memproses penghapusan akun.");
      setIsDeleting(false);
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "owner":
        return "amber";
      case "admin":
        return "emerald";
      case "guru":
        return "blue";
      default:
        return "indigo";
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
        Memuat profil pengguna...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-fade-in text-[#0F172A]">
      <div>
        <h1 className="editorial-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Pengaturan Akun & Profil
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola informasi identitas belajar, status kebijakan, dan preferensi privasi akun NemoLearn Anda.
        </p>
      </div>

      {/* Admin Quick Callout if user is Admin / Owner */}
      {(user?.role === "admin" || user?.role === "owner") && (
        <Card className="p-5 border-brand-200 bg-brand-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Akses Administrator Terdeteksi</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kelola direktori pengguna, bank soal kurikulum, evaluasi sesi kuis, dan konfigurasi server.
              </p>
            </div>
          </div>
          <Link href="/admin">
            <Button variant="primary" size="sm" className="whitespace-nowrap">
              <span>Buka Panel Admin</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </Card>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Profile Form */}
      <Card className="p-6 sm:p-8 space-y-5">
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div>
            <label className="ui-label block text-slate-700 mb-1.5">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="ui-label block text-slate-700 mb-1.5">
              Alamat Email (Akun)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              className="w-full bg-slate-100/70 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Email bersifat privat dan digunakan untuk identifikasi akun.
            </p>
          </div>

          <div>
            <label className="ui-label block text-slate-700 mb-1.5">
              Peran (Role RBAC)
            </label>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(user?.role)} size="md" className="uppercase font-mono">
                {user?.role}
              </Badge>
              <span className="text-xs text-slate-500">
                (Peran menentukan izin akses sistem dan hak pengelolaan)
              </span>
            </div>
          </div>

          <div>
            <label className="ui-label block text-slate-700 mb-1.5">
              Asal Sekolah (SMA / Sederajat)
            </label>
            <input
              type="text"
              placeholder="Contoh: SMAN 1 Jakarta"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="ui-label block text-slate-700 mb-1.5">
              Jenis Kelamin
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-hidden focus:border-brand-500"
            >
              <option value="rahasia">Tidak Ingin Menyebutkan</option>
              <option value="laki-laki">Laki-laki</option>
              <option value="perempuan">Perempuan</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Consent Management & Policy Status Card */}
      <Card className="p-6 border-[#E5E7EB] bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0F172A]">
            <Shield className="w-4 h-4 text-[#16A34A]" />
            Status Persetujuan Kebijakan & Privasi
          </div>
          <Badge variant="green" size="sm">
            Tercatat
          </Badge>
        </div>

        <div className="space-y-3 text-xs text-[#475569]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#F8FAFC] pb-2">
            <div>
              <p className="font-bold text-[#0F172A]">Ketentuan Layanan (Terms of Service)</p>
              <p className="text-[11px] text-[#64748B]">
                Versi aktif: <strong>{user?.tosVersion || "2026.11"}</strong>
                {user?.tosAcceptedAt && (
                  <span> &bull; Disetujui: {new Date(user.tosAcceptedAt).toLocaleDateString("id-ID")}</span>
                )}
              </p>
            </div>
            <Link
              href="/terms"
              target="_blank"
              className="text-[#16A34A] hover:underline font-bold text-xs inline-flex items-center gap-1"
            >
              Tinjau Dokumen <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#F8FAFC] pb-2">
            <div>
              <p className="font-bold text-[#0F172A]">Kebijakan Privasi (Privacy Policy)</p>
              <p className="text-[11px] text-[#64748B]">
                Versi aktif: <strong>{user?.privacyVersion || "2026.11"}</strong>
                {user?.privacyAcceptedAt && (
                  <span> &bull; Disetujui: {new Date(user.privacyAcceptedAt).toLocaleDateString("id-ID")}</span>
                )}
              </p>
            </div>
            <Link
              href="/privacy"
              target="_blank"
              className="text-[#16A34A] hover:underline font-bold text-xs inline-flex items-center gap-1"
            >
              Tinjau Dokumen <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="pt-1">
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Persetujuan dicatat secara otomatis pada sistem audit forensik NemoLearn. Jika terdapat pembaruan kebijakan privasi atau syarat layanan, sistem akan meminta konfirmasi persetujuan ulang saat Anda masuk ke platform.
            </p>
          </div>
        </div>
      </Card>

      {/* Danger Zone: Delete Account */}
      <Card className="p-6 border-[#FECACA] bg-[#FEF2F2]/30 space-y-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#991B1B]">
          <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
          Zona Bahaya (Danger Zone) — Pengelolaan Akun
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-md">
            <p className="text-xs font-bold text-[#0F172A]">Hapus Akun Pengguna Secara Permanen</p>
            <p className="text-[11px] text-[#64748B] leading-relaxed">
              Menghapus profil pribadi, kata sandi, dan mencabut seluruh sesi login aktif. Riwayat kuis latihan akan dianonimkan untuk menjaga kestabilan bank soal. Tindakan ini <strong>bersifat final dan tidak dapat dibatalkan</strong>.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => {
              setIsDeleteModalOpen(true);
              setDeleteError(null);
            }}
            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs py-2 px-3.5 rounded-xl whitespace-nowrap shadow-xs cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Hapus Akun Saya
          </Button>
        </div>
      </Card>

      {/* Modal Dialog Konfirmasi Hapus Akun */}
      {isDeleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
        >
          <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#F1F5F9] pb-3">
              <div className="flex items-center gap-2.5 text-[#991B1B] font-bold text-sm sm:text-base">
                <div className="w-8 h-8 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                Konfirmasi Hapus Akun
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="p-1 text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F3F4EE] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Details */}
            <div className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Dampak Penghapusan Akun:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed pl-1 text-[#7F1D1D]">
                <li>Data profil pribadi (nama, email, sekolah) akan dihapus secara permanen.</li>
                <li>Seluruh token sesi aktif akan dicabut seketika.</li>
                <li>Riwayat sesi latihan Anda akan dianonimkan (*anonymized*) tanpa mengaitkan data pribadi.</li>
                <li>Anda tidak akan dapat masuk kembali menggunakan email ini kecuali mendaftar baru.</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleDeleteAccount} className="space-y-4 text-xs">
              {user?.passwordHash ? (
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Masukkan Kata Sandi Anda untuk Verifikasi Identitas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Kata sandi akun Anda"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-rose-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    Ketik konfirmasi: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-rose-600">HAPUS AKUN SAYA</code> <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="HAPUS AKUN SAYA"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <Button
                  type="submit"
                  disabled={isDeleting}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Memproses Penghapusan...
                    </>
                  ) : (
                    "Hapus Akun Sekarang"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
