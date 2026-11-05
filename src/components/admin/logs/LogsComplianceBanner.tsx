"use client";

import React, { useState } from "react";
import { ShieldCheck, CheckCircle2, Lock, ArrowUpRight } from "lucide-react";

interface LogsComplianceBannerProps {
  onVerifyHash: () => void;
}

export const LogsComplianceBanner: React.FC<LogsComplianceBannerProps> = ({
  onVerifyHash,
}) => {
  return (
    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0 mt-0.5 sm:mt-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight">
            Kepatuhan Forensik Standar ISO/IEC 27001 & PDP UU No. 27/2022
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Seluruh log audit diamankan dengan hash SHA-256 immutable. Integritas data diverifikasi secara kriptografis tiap pergantian siklus UTC tanpa celah manipulasi.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto font-mono text-xs">
        <button
          type="button"
          onClick={onVerifyHash}
          className="px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verifikasi Hash Rantai</span>
        </button>
      </div>
    </div>
  );
};
