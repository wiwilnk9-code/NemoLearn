"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, ToastMessage, ToastType, TOAST_EVENT } from "@/lib/design-system/toast";

export { toast };
export type { ToastMessage, ToastType };

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    // Subscribe to toast dispatcher
    const unsubscribe = toast.subscribe((newToast) => {
      setToasts((prev) => [...prev.slice(-4), newToast]); // max 5 concurrent toasts

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(newToast.id);
        }, newToast.duration);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      {toasts.map((t) => {
        const config = {
          success: {
            icon: <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" />,
            border: "border-[#BBF7D0]",
            bg: "bg-white",
            indicator: "bg-[#16A34A]",
          },
          error: {
            icon: <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />,
            border: "border-[#FECACA]",
            bg: "bg-white",
            indicator: "bg-[#DC2626]",
          },
          warning: {
            icon: <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />,
            border: "border-[#FDE68A]",
            bg: "bg-white",
            indicator: "bg-[#D97706]",
          },
          info: {
            icon: <Info className="w-5 h-5 text-[#0284C7] shrink-0" />,
            border: "border-[#BAE6FD]",
            bg: "bg-white",
            indicator: "bg-[#0284C7]",
          },
        }[t.type];

        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all animate-scale-in relative overflow-hidden",
              config.bg,
              config.border
            )}
          >
            <div className={cn("absolute left-0 top-0 bottom-0 w-1", config.indicator)} />
            <div className="pt-0.5">{config.icon}</div>
            <div className="flex-1 min-w-0 pr-4">
              {t.title && (
                <p className="text-xs font-bold text-[#0F172A] leading-tight mb-0.5">
                  {t.title}
                </p>
              )}
              <p className="text-xs text-[#334155] leading-relaxed break-words">
                {t.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-[#94A3B8] hover:text-[#0F172A] p-0.5 rounded transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
