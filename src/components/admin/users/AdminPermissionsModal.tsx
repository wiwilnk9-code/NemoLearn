"use client";

import React, { useState, useEffect } from "react";
import { Key, Shield, Check, AlertCircle } from "lucide-react";
import { User, AdminPermission, ALL_ADMIN_PERMISSIONS } from "@/types/user";
import { AdminModal } from "@/components/admin/ui/AdminModal";

interface AdminPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (userId: string, permissions: AdminPermission[]) => Promise<void>;
}

export const AdminPermissionsModal: React.FC<AdminPermissionsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<AdminPermission[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.permissions) {
      setSelectedPermissions([...user.permissions]);
    } else {
      setSelectedPermissions([]);
    }
    setError(null);
  }, [user, isOpen]);

  if (!user) return null;

  const handleToggle = (permId: AdminPermission) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermissions(ALL_ADMIN_PERMISSIONS.map((p) => p.id));
  };

  const handleDeselectAll = () => {
    setSelectedPermissions([]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(user.id, selectedPermissions);
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan hak izin.");
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { key: "manajemen", label: "Manajemen Platform & Pengguna" },
    { key: "akademik", label: "Bank Soal & Sesi Belajar SMA" },
    { key: "sistem", label: "Mesin AI & Pengaturan Inti" },
  ];

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Kelola Izin Akses Administrator"
      description={`Konfigurasi hak akses modular untuk ${user.displayName}`}
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[#FEE4E2] border border-[#FECDCA] text-[#D92D20] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* User Card */}
        <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-[#101828]">
                {user.displayName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0B559F] text-white">
                ADMIN
              </span>
            </div>
            <span className="text-xs text-[#475467] font-mono block mt-0.5">
              {user.email}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-semibold text-[#0B559F] hover:underline"
            >
              Pilih Semua
            </button>
            <span className="text-[#D0D5DD]">&bull;</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-[11px] font-semibold text-[#667085] hover:underline"
            >
              Batal Semua
            </button>
          </div>
        </div>

        {/* Grouped Permissions */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const permsInCat = ALL_ADMIN_PERMISSIONS.filter((p) => p.category === cat.key);
            if (permsInCat.length === 0) return null;

            return (
              <div key={cat.key} className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider font-mono text-[#475467] block">
                  {cat.label}
                </span>

                <div className="space-y-1.5">
                  {permsInCat.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);

                    return (
                      <label
                        key={perm.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? "bg-[#EEF3F9] border-[#B2D0F7]"
                            : "bg-[#FFFFFF] border-[#EAECF0] hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggle(perm.id)}
                          className="mt-0.5 w-4 h-4 rounded text-[#0B559F] focus:ring-0 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#101828]">
                              {perm.label}
                            </span>
                            <span className="text-[10px] font-mono text-[#667085] px-1.5 py-0.2 rounded bg-[#F2F4F7]">
                              {perm.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#475467] mt-0.5 leading-relaxed">
                            {perm.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-[#EAECF0] flex items-center justify-between">
          <span className="text-xs text-[#667085] font-mono">
            {selectedPermissions.length} dari {ALL_ADMIN_PERMISSIONS.length} izin aktif
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3F9] text-[#344054] text-xs font-semibold border border-[#D0D5DD] transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#0B559F] hover:bg-[#083E75] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Hak Akses"}
            </button>
          </div>
        </div>
      </div>
    </AdminModal>
  );
};
