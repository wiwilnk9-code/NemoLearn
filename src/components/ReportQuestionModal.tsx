"use client";

import React, { useState } from "react";
import { Flag, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReportQuestionModalProps {
  questionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
  questionId,
  isOpen,
  onClose,
}) => {
  const [reasonCategory, setReasonCategory] = useState<string>("kunci_jawaban_keliru");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "question",
          targetId: questionId,
          action: "report_issue",
          reason: `[${reasonCategory}] ${details.trim() || "Tidak ada rincian tambahan"}`,
        }),
      });

      if (!res.ok) {
        throw new Error("Gagal mengirim laporan. Silakan coba kembali.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Gagal mengirim laporan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div className="bg-white border border-[#E5E7EB] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
        <div className="flex items-center justify-between border-b border-[#F3F4EE] pb-3">
          <div className="flex items-center gap-2.5 text-[#0F172A] font-bold text-sm sm:text-base">
            <div className="w-8 h-8 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            Laporkan Kendala Butir Soal
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F3F4EE] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mx-auto border border-[#BBF7D0]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#0F172A]">Laporan Terkirim</h4>
            <p className="text-xs text-[#64748B]">
              Terima kasih. Masukan Anda akan ditinjau oleh guru dan tim kurikulum.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Kategori Kendala:
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs text-[#0F172A] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
              >
                <option value="kunci_jawaban_keliru">Kunci jawaban tidak sesuai / keliru</option>
                <option value="rumus_latex_rusak">Rumus matematika / simbol LaTeX rusak</option>
                <option value="materi_tidak_sesuai">Materi tidak sesuai kurikulum SMA</option>
                <option value="soal_rancu">Soal atau opsi jawaban membingungkan (typo/rancu)</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Rincian Masalah (Opsional):
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Jelaskan bagian soal atau rumus yang terkendala..."
                className="w-full bg-white border border-[#E5E7EB] rounded-xl p-3 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-1/2"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="danger"
                className="w-1/2"
                isLoading={isSubmitting}
              >
                Kirim Laporan
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
