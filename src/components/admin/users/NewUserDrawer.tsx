"use client";

import React, { useState } from "react";
import { X, UserPlus, ShieldAlert, Check, AlertCircle } from "lucide-react";
import { User, UserRole, AdminPermission, ALL_ADMIN_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS } from "@/types/user";

interface NewUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<boolean>;
  currentUser: User | null;
}

export const NewUserDrawer: React.FC<NewUserDrawerProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("pelajar");
  const [school, setSchool] = useState("");
  const [nuptk, setNuptk] = useState("");
  const [nip, setNip] = useState("");
  const [subject, setSubject] = useState("");
  const [gender, setGender] = useState<"laki-laki" | "perempuan" | "rahasia">("rahasia");
  const [bypassVerification, setBypassVerification] = useState(true);
  const [permissions, setPermissions] = useState<AdminPermission[]>([...DEFAULT_ADMIN_PERMISSIONS]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOwner = currentUser?.role === "owner";

  const handleTogglePermission = (permId: AdminPermission) => {
    setPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim() || !email.trim()) {
      setError("Nama lengkap dan alamat email wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        displayName: displayName.trim(),
        email: email.trim().toLowerCase(),
        role,
        school: school.trim() || undefined,
        nuptk: nuptk.trim() || undefined,
        nip: nip.trim() || undefined,
        subject: subject.trim() || undefined,
        gender,
        bypassVerification,
      };

      if (role === "admin") {
        payload.permissions = permissions;
      }

      const success = await onSubmit(payload);
      if (success) {
        // Reset form
        setDisplayName("");
        setEmail("");
        setRole("pelajar");
        setSchool("");
        setNuptk("");
        setNip("");
        setSubject("");
        setGender("rahasia");
        setBypassVerification(true);
        setPermissions([...DEFAULT_ADMIN_PERMISSIONS]);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Gagal membuat pengguna baru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#FFFFFF] shadow-2xl z-50 flex flex-col border-l border-[#D0D5DD] animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 bg-[#EEF3F9] border-b border-[#D0D5DD] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B559F] text-white flex items-center justify-center shrink-0 shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101828] font-['Plus_Jakarta_Sans']">
                Tambah Pengguna Baru
              </h3>
              <p className="text-xs text-[#475467]">
                Registrasi akun manual &amp; delegasi role privilege
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#667085] hover:text-[#101828] hover:bg-[#D0D5DD]/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-[#FEE4E2] border border-[#FECDCA] text-[#D92D20] text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[#344054] font-semibold mb-1">
              Nama Lengkap &amp; Gelar *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Cth: Dr. Ahmad Dahlan, M.Sc"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#0B559F] focus:ring-1 focus:ring-[#0B559F]"
            />
          </div>

          <div>
            <label className="block text-[#344054] font-semibold mb-1">
              Alamat Email Resmi *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sekolah.sch.id atau nama@gmail.com"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#0B559F] focus:ring-1 focus:ring-[#0B559F] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#344054] font-semibold mb-1">
                Peran (Role) *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:border-[#0B559F]"
              >
                <option value="pelajar">Siswa (Pelajar)</option>
                <option value="guru">Guru (Pendidik)</option>
                <option value="moderator">Moderator Konten</option>
                {isOwner && <option value="admin">Administrator</option>}
                {isOwner && <option value="owner">Owner (Superadmin)</option>}
              </select>
            </div>

            <div>
              <label className="block text-[#344054] font-semibold mb-1">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] focus:outline-none focus:border-[#0B559F]"
              >
                <option value="rahasia">Tidak Disebutkan</option>
                <option value="laki-laki">Laki-laki</option>
                <option value="perempuan">Perempuan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#344054] font-semibold mb-1">
              Asal Sekolah / Institusi
            </label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Cth: SMAN 1 Jakarta / SMKN 3 Bandung"
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#0B559F]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#344054] font-semibold mb-1">
                NUPTK / NISN (Opsional)
              </label>
              <input
                type="text"
                value={nuptk}
                onChange={(e) => setNuptk(e.target.value)}
                placeholder="16 digit angka"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#0B559F] font-mono"
              />
            </div>
            <div>
              <label className="block text-[#344054] font-semibold mb-1">
                Mata Pelajaran (Opsional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Cth: Fisika, Matematika"
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D0D5DD] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#0B559F]"
              />
            </div>
          </div>

          {/* Teacher Bypass Option */}
          {role === "guru" && (
            <div className="p-3.5 rounded-xl bg-[#EEF3F9] border border-[#B2D0F7] space-y-1.5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#101828] font-semibold">
                  Bypass Verifikasi Manual
                </span>
                <input
                  type="checkbox"
                  checked={bypassVerification}
                  onChange={(e) => setBypassVerification(e.target.checked)}
                  className="rounded text-[#0B559F] focus:ring-0 focus:outline-none w-4 h-4 cursor-pointer"
                />
              </label>
              <p className="text-[11px] text-[#475467]">
                Secara otomatis memberikan status terverifikasi resmi tanpa harus melalui antrean moderasi.
              </p>
            </div>
          )}

          {/* Admin Granular Permissions (Owner only) */}
          {role === "admin" && isOwner && (
            <div className="p-3.5 rounded-xl bg-[#EEF3F9] border border-[#B2D0F7] space-y-2">
              <span className="text-[#101828] font-semibold block">
                Hak Izin Administrator Awal:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {ALL_ADMIN_PERMISSIONS.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-white border border-[#E4E7EC] cursor-pointer hover:bg-[#F8FAFC]"
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(perm.id)}
                      onChange={() => handleTogglePermission(perm.id)}
                      className="mt-0.5 rounded text-[#0B559F] focus:ring-0 w-3.5 h-3.5"
                    />
                    <div>
                      <span className="font-semibold text-[#101828] block">
                        {perm.label}
                      </span>
                      <span className="text-[10px] text-[#667085] block">
                        {perm.description}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Drawer Footer Actions */}
          <div className="pt-4 border-t border-[#EAECF0] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3F9] text-[#344054] text-xs font-semibold border border-[#D0D5DD] transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#0B559F] hover:bg-[#083E75] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? "Menyimpan..." : "Simpan & Terbitkan Akun"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
