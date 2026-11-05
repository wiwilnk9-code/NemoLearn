"use client";

import React, { useState } from "react";
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { MaskedApiVaultItem } from "@/types/settings";

interface ApiKeyRotateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetProvider: MaskedApiVaultItem | null;
  onRotateSuccess: (provider: string, newMaskedKey: string) => void;
}

export const ApiKeyRotateModal: React.FC<ApiKeyRotateModalProps> = ({
  isOpen,
  onClose,
  targetProvider,
  onRotateSuccess,
}) => {
  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!targetProvider) return null;

  const handleRotate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) {
      setError("Kunci API baru tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rotate_key",
          provider: targetProvider.provider,
          apiKey: newKey.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gagal memperbarui API Key.");
      }

      setNewKey("");
      onRotateSuccess(targetProvider.provider, data.message || "Berhasil");
      onClose();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan API Key baru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-600" />
          <span>Rotasi Kredensial API Key: {targetProvider.name}</span>
        </div>
      }
      description="Perbarui kredensial provider secara aman tanpa membocorkan kunci sebelumnya ke browser."
      size="md"
    >
      <form onSubmit={handleRotate} className="space-y-4">
        {/* Current Masked Key Info */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
          <span className="text-slate-500 font-mono block">Kunci Aktif Saat Ini:</span>
          <div className="flex items-center justify-between font-mono font-semibold text-slate-800">
            <span>{targetProvider.maskedKey}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              {targetProvider.lastRotatedText}
            </span>
          </div>
        </div>

        {/* Input New Key */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-slate-700 block font-medium">
            Masukkan Kunci API Baru ({targetProvider.provider.toUpperCase()})
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder={`e.g. ${
                targetProvider.provider === "gemini"
                  ? "AIzaSy..."
                  : targetProvider.provider === "anthropic"
                  ? "sk-ant-api..."
                  : "sk-..."
              }`}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg pl-3 pr-10 py-2.5 font-mono focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Kredensial langsung dienkripsi di server dan disimpan ke vault aman.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Setiap aksi rotasi kredensial dicatat secara permanen di Governance Audit Trail tanpa menyimpan plaintext kunci.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg text-xs font-mono font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading || !newKey.trim()}
            className="px-4 py-2 rounded-lg text-xs font-mono font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan & Mengenkripsi...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan Kunci Baru</span>
              </>
            )}
          </button>
        </div>
      </form>
    </AdminModal>
  );
};
