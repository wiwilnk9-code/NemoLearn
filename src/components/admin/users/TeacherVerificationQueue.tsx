"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  ExternalLink,
  Award,
  AlertCircle,
  School,
  BookOpen,
} from "lucide-react";
import { User } from "@/types/user";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { AdminConfirmDialog } from "@/components/admin/ui/AdminConfirmDialog";

interface TeacherVerificationQueueProps {
  candidates: User[];
  onApprove: (user: User, note?: string) => Promise<void>;
  onReject: (user: User, note?: string) => Promise<void>;
  onViewAll?: () => void;
  loading?: boolean;
}

export const TeacherVerificationQueue: React.FC<TeacherVerificationQueueProps> = ({
  candidates,
  onApprove,
  onReject,
  onViewAll,
  loading = false,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<User | null>(null);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [verificationNoteInput, setVerificationNoteInput] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);

  // Quick confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "approve" | "reject";
    user: User | null;
  }>({
    isOpen: false,
    type: "approve",
    user: null,
  });

  const handleOpenReview = (user: User) => {
    setSelectedCandidate(user);
    setVerificationNoteInput(user.verificationNote || "");
    setShowPortfolioModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.user) return;
    setActionInProgress(true);
    try {
      if (confirmDialog.type === "approve") {
        await onApprove(confirmDialog.user);
      } else {
        await onReject(confirmDialog.user);
      }
    } finally {
      setActionInProgress(false);
      setConfirmDialog({ isOpen: false, type: "approve", user: null });
    }
  };

  const handleModalApprove = async () => {
    if (!selectedCandidate) return;
    setActionInProgress(true);
    try {
      await onApprove(selectedCandidate, verificationNoteInput.trim() || undefined);
      setShowPortfolioModal(false);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleModalReject = async () => {
    if (!selectedCandidate) return;
    setActionInProgress(true);
    try {
      await onReject(selectedCandidate, verificationNoteInput.trim() || undefined);
      setShowPortfolioModal(false);
    } finally {
      setActionInProgress(false);
    }
  };

  if (!candidates || candidates.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#D0D5DD] rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all">
      {/* Decorative Top Accent Glow */}
      <div className="absolute -top-16 left-1/4 w-72 h-20 bg-[#0B559F]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F2F4F7]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F1FC] text-[#0B559F] flex items-center justify-center shrink-0 border border-[#B2D0F7]">
            <ShieldCheck className="w-5 h-5 text-[#0B559F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-[#101828] font-['Plus_Jakarta_Sans']">
                Antrean Persetujuan Kredensial Pengajar
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0B559F] text-white">
                {candidates.length} PERLU DITINJAU
              </span>
            </div>
            <p className="text-xs text-[#475467] mt-0.5">
              Validasi sertifikasi NUPTK, portofolio mengajar, dan SK instansi sebelum menerbitkan badge Guru Resmi NemoLearn.
            </p>
          </div>
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#0B559F] hover:text-[#083E75] px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF3F9] border border-[#D0D5DD] transition-all self-start sm:self-auto shrink-0"
          >
            Buka Filter Verifikasi ({candidates.length}) &rarr;
          </button>
        )}
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
        {candidates.slice(0, 3).map((candidate) => {
          const initials = candidate.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <div
              key={candidate.id}
              className="bg-[#F8FAFC] border border-[#E4E7EC] hover:border-[#B2D0F7] rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-sm"
            >
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0B559F] to-[#53389E] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-xs sm:text-sm font-bold text-[#101828] truncate">
                        {candidate.displayName}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#E8F8F2] text-[#0FA97A] font-semibold shrink-0">
                        {candidate.nuptk ? "NUPTK OK" : "REGISTRASI"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475467] truncate mt-0.5 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-[#667085] shrink-0" />
                      <span>{candidate.subject || "Pengajar SMA"}</span>
                      <span>&bull;</span>
                      <span className="truncate">{candidate.school || "Sekolah Indonesia"}</span>
                    </p>
                    {candidate.verificationNote && (
                      <p className="text-[10px] text-[#53389E] font-medium truncate mt-1">
                        {candidate.verificationNote}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#EAECF0]">
                <button
                  type="button"
                  disabled={actionInProgress}
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      type: "approve",
                      user: candidate,
                    })
                  }
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#E8F8F2] hover:bg-[#D1FADF] text-[#027A48] border border-[#A6F4C5] text-xs font-semibold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                  title="Setujui permohonan pengajar"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Setujui</span>
                </button>
                <button
                  type="button"
                  disabled={actionInProgress}
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      type: "reject",
                      user: candidate,
                    })
                  }
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#FEE4E2] hover:bg-[#FECDCA] text-[#D92D20] border border-[#FECDCA] text-xs font-semibold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                  title="Tolak permohonan pengajar"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Tolak</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenReview(candidate)}
                  className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#EEF3F9] text-[#344054] border border-[#D0D5DD] transition-all"
                  title="Tinjau Berkas Portofolio"
                >
                  <Eye className="w-4 h-4 text-[#475467]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Portfolio Modal */}
      {selectedCandidate && (
        <AdminModal
          isOpen={showPortfolioModal}
          onClose={() => setShowPortfolioModal(false)}
          title="Tinjau Berkas Kredensial Pengajar"
          description={`Verifikasi data sertifikasi dan portofolio ${selectedCandidate.displayName}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Candidate Summary Card */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E4E7EC] flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0B559F] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {selectedCandidate.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#101828]">
                    {selectedCandidate.displayName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#E8F8F2] text-[#0FA97A] font-semibold">
                    Guru / Pendidik
                  </span>
                </div>
                <p className="text-xs text-[#475467] font-mono mt-0.5">
                  {selectedCandidate.email}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#344054]">
                  <span className="flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-[#667085]" />
                    {selectedCandidate.school || "Instansi Belum Dicatat"}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#667085]" />
                    {selectedCandidate.subject || "Semua Mapel"}
                  </span>
                </div>
              </div>
            </div>

            {/* Credential Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#EAECF0]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] block">
                  Nomor NUPTK
                </span>
                <span className="text-xs font-mono font-bold text-[#101828] mt-0.5 block">
                  {selectedCandidate.nuptk || "Tidak disertakan"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#FFFFFF] border border-[#EAECF0]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#667085] block">
                  Nomor NIP / KTP
                </span>
                <span className="text-xs font-mono font-bold text-[#101828] mt-0.5 block">
                  {selectedCandidate.nip || "Tidak disertakan"}
                </span>
              </div>
            </div>

            {/* Portfolio Link / Attachments */}
            <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#EAECF0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#101828] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#0B559F]" />
                  Dokumen &amp; Portofolio Mengajar
                </span>
                {selectedCandidate.portfolioUrl ? (
                  <a
                    href={selectedCandidate.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B559F] hover:underline"
                  >
                    Buka Tautan Portofolio
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-[#98A2B3] italic">
                    Tidak ada tautan berkas online
                  </span>
                )}
              </div>
              {selectedCandidate.verificationNote && (
                <div className="p-2.5 rounded-lg bg-[#EEF3F9] text-xs text-[#1D2939] font-mono">
                  {selectedCandidate.verificationNote}
                </div>
              )}
            </div>

            {/* Verifier Notes Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#344054]">
                Catatan Verifikator / Alasan (Disimpan di Riwayat Audit)
              </label>
              <textarea
                value={verificationNoteInput}
                onChange={(e) => setVerificationNoteInput(e.target.value)}
                placeholder="Cth: Dokumen SK Pengangkatan dan NUPTK telah diverifikasi valid oleh Tim Akademik."
                rows={3}
                className="w-full text-xs rounded-lg border border-[#D0D5DD] p-2.5 text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#0B559F] focus:ring-1 focus:ring-[#0B559F]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAECF0]">
              <button
                type="button"
                disabled={actionInProgress}
                onClick={handleModalReject}
                className="px-4 py-2 rounded-lg bg-[#FEE4E2] hover:bg-[#FECDCA] text-[#D92D20] text-xs font-semibold transition-all disabled:opacity-50"
              >
                Tolak Pengajuan
              </button>
              <button
                type="button"
                disabled={actionInProgress}
                onClick={handleModalApprove}
                className="px-4 py-2 rounded-lg bg-[#0FA97A] hover:bg-[#0c8a63] text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                Setujui &amp; Terbitkan Badge Guru
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Confirmation Dialog for Quick Actions */}
      <AdminConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, type: "approve", user: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.type === "approve"
            ? "Setujui Kredensial Pengajar"
            : "Tolak Pengajuan Pengajar"
        }
        message={
          confirmDialog.type === "approve"
            ? `Apakah Anda yakin ingin menyetujui akun ${confirmDialog.user?.displayName}? Pengguna akan menerima hak akses dan lencana Pengajar Terverifikasi NemoLearn.`
            : `Apakah Anda yakin ingin menolak permohonan dari ${confirmDialog.user?.displayName}?`
        }
        confirmLabel={confirmDialog.type === "approve" ? "Setujui Pengajar" : "Tolak Pengajuan"}
        cancelLabel="Batal"
        variant={confirmDialog.type === "approve" ? "success" : "danger"}
        isLoading={actionInProgress}
      />
    </div>
  );
};
