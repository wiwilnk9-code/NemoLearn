"use client";

import React from "react";
import Link from "next/link";
import { Wrench, Clock, ShieldAlert, Sparkles, RefreshCw } from "lucide-react";
import { useRealtimeMaintenance } from "@/hooks/useRealtimeMaintenance";
import { Button } from "@/components/ui/Button";

export const MaintenanceOverlay: React.FC = () => {
  const { maintenanceMode, maintenance, isBypassed, loading, refresh } = useRealtimeMaintenance();

  // If loading or maintenance not active or user is an authorized owner/admin, do not show overlay
  if (loading || !maintenanceMode || isBypassed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#FAF9F5] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-[#E5E7EB] shadow-2xl p-6 sm:p-10 text-center space-y-6 animate-fade-in my-auto">
        {/* Brand Icon Badge */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#16A34A] to-[#84CC16] flex items-center justify-center text-white shadow-lg">
          <Wrench className="w-10 h-10 animate-bounce" />
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#FEF2F2] border-2 border-white flex items-center justify-center text-[#DC2626]">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#16A34A] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            NemoLearn SMA AI
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
            Mode Pemeliharaan Sistem
          </h1>
        </div>

        {/* Message */}
        <div className="bg-[#FAF9F5] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 text-left space-y-2">
          <p className="text-xs sm:text-sm text-[#334155] leading-relaxed font-medium">
            {maintenance?.message ||
              "Platform NemoLearn saat ini sedang menjalani peningkatan infrastruktur dan pemeliharaan rutin terencana untuk meningkatkan kualitas layanan."}
          </p>

          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#16A34A]" />
              Estimasi Selesai:
            </span>
            <span className="font-bold text-[#0F172A]">
              {maintenance?.estimatedEndTime || "14:00 WIB"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => refresh()}
          >
            <RefreshCw className="w-4 h-4" />
            Periksa Status Terkini
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-[#94A3B8]">
            <ShieldAlert className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Administrator atau Owner?</span>
            <Link
              href="/admin/login"
              className="text-[#16A34A] font-semibold hover:underline"
            >
              Masuk Di Sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
