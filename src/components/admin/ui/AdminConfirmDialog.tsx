"use client";

import React from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Loader2 } from "lucide-react";
import { AdminModal } from "@/components/admin/ui/AdminModal";
import { cn } from "@/lib/utils";

export interface AdminConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Konfirmasi Tindakan",
  cancelLabel = "Batal",
  variant = "danger",
  isLoading = false,
}) => {
  const config = {
    danger: {
      icon: AlertCircle,
      iconColor: "text-[#D92D20]",
      iconBg: "bg-[#FEE4E2] border-[#FECDCA]",
      confirmBtn: "bg-[#D92D20] hover:bg-[#B91C1C] text-white shadow-xs",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-[#D97706]",
      iconBg: "bg-[#FFFBEB] border-[#FDE68A]",
      confirmBtn: "bg-[#D97706] hover:bg-[#B45309] text-white shadow-xs",
    },
    info: {
      icon: Info,
      iconColor: "text-[#0B559F]",
      iconBg: "bg-[#D1E9FF] border-[#B2DDFF]",
      confirmBtn: "bg-[#0B559F] hover:bg-[#094582] text-white shadow-xs",
    },
    success: {
      icon: CheckCircle2,
      iconColor: "text-[#0FA97A]",
      iconBg: "bg-[#D1FADF] border-[#A6F4C5]",
      confirmBtn: "bg-[#0FA97A] hover:bg-[#08875D] text-white shadow-xs",
    },
  }[variant];

  const Icon = config.icon;

  const footer = (
    <>
      <button
        type="button"
        disabled={isLoading}
        onClick={onClose}
        className="px-4 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs font-semibold text-[#475467] hover:bg-[#F1F5F9] hover:text-[#101828] transition-colors disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        disabled={isLoading}
        onClick={onConfirm}
        className={cn(
          "px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50",
          config.confirmBtn
        )}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        <span>{confirmLabel}</span>
      </button>
    </>
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={footer}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
            config.iconBg,
            config.iconColor
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-[#101828] leading-tight">
            {title}
          </h4>
          <p className="text-xs text-[#475467] mt-1.5 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </AdminModal>
  );
};
