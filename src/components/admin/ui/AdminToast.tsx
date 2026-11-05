"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { toast, ToastMessage, ToastType } from "@/lib/design-system/toast";
import { cn } from "@/lib/utils";

export { toast };
export type { ToastMessage, ToastType };

export const AdminToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
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
    <div
      role="region"
      aria-label="Pemberitahuan Sistem"
      className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0"
    >
      {toasts.map((t) => {
        const config = {
          success: {
            icon: <CheckCircle2 className="w-5 h-5 text-[#0FA97A] shrink-0" />,
            border: "border-[#A6F4C5]",
            bg: "bg-white",
            indicator: "bg-[#0FA97A]",
          },
          error: {
            icon: <AlertCircle className="w-5 h-5 text-[#D92D20] shrink-0" />,
            border: "border-[#FECDCA]",
            bg: "bg-white",
            indicator: "bg-[#D92D20]",
          },
          warning: {
            icon: <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />,
            border: "border-[#FDE68A]",
            bg: "bg-white",
            indicator: "bg-[#D97706]",
          },
          info: {
            icon: <Info className="w-5 h-5 text-[#0B559F] shrink-0" />,
            border: "border-[#B2DDFF]",
            bg: "bg-white",
            indicator: "bg-[#0B559F]",
          },
        }[t.type];

        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-sapphire-dropdown transition-all animate-scale-in relative overflow-hidden",
              config.bg,
              config.border
            )}
          >
            {/* Color Accent Pill */}
            <div
              className={cn("absolute left-0 top-0 bottom-0 w-1", config.indicator)}
            />
            <div className="pt-0.5">{config.icon}</div>
            <div className="flex-1 min-w-0 pr-2">
              {t.title && (
                <p className="text-xs font-bold text-[#101828] leading-tight mb-0.5">
                  {t.title}
                </p>
              )}
              <p className="text-xs text-[#475467] leading-relaxed break-words">
                {t.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="text-[#94A3B8] hover:text-[#101828] p-1 rounded-md transition-colors"
              aria-label="Tutup pemberitahuan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
