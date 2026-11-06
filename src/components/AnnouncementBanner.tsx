"use client";

import React from "react";
import { useRealtimeAnnouncements } from "@/hooks/useRealtimeAnnouncements";
import { Info, AlertTriangle, AlertOctagon, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const AnnouncementBanner: React.FC = () => {
  const { announcements, dismissAnnouncement } = useRealtimeAnnouncements();

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-2 px-4 sm:px-6 lg:px-8 pt-3 max-w-7xl mx-auto">
      {announcements.map((ann) => {
        const isWarning = ann.type === "warning";
        const isDanger = ann.type === "danger";
        const isMaintenance = ann.type === "maintenance";

        const bgClass = isDanger
          ? "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
          : isWarning
          ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
          : isMaintenance
          ? "bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]"
          : "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]";

        const IconComponent = isDanger
          ? AlertOctagon
          : isWarning
          ? AlertTriangle
          : isMaintenance
          ? Wrench
          : Info;

        return (
          <div
            key={ann.id}
            className={cn(
              "flex items-start justify-between gap-3 p-3 sm:p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all shadow-2xs animate-fade-in",
              bgClass
            )}
          >
            <div className="flex items-start gap-2.5 sm:gap-3 flex-1">
              <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">{ann.title}</span>
                <span className="hidden sm:inline"> — </span>
                <p className="sm:inline text-xs opacity-90 leading-relaxed">{ann.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => dismissAnnouncement(ann.id)}
              className="p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
              title="Tutup pengumuman"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
