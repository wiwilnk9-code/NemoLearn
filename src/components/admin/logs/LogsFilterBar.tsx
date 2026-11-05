"use client";

import React, { useRef } from "react";
import { Search, RotateCcw, Filter, X } from "lucide-react";

interface LogsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  level: string;
  onLevelChange: (lvl: string) => void;
  onReset: () => void;
}

export const LogsFilterBar: React.FC<LogsFilterBarProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  level,
  onLevelChange,
  onReset,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories: Array<{ id: string; label: string }> = [
    { id: "all", label: "Semua Kategori" },
    { id: "auth", label: "Login & Sesi" },
    { id: "role_change", label: "Perubahan Role" },
    { id: "admin", label: "Aktivitas Admin" },
    { id: "user", label: "Aktivitas Siswa" },
    { id: "ai", label: "Permintaan AI" },
    { id: "system", label: "Error Sistem & Exception" },
    { id: "settings", label: "Perubahan Pengaturan" },
    { id: "security", label: "Keamanan" },
  ];

  const levels: Array<{ id: string; label: string; dotColor: string }> = [
    { id: "all", label: "SEMUA SEVERITY", dotColor: "bg-slate-400" },
    { id: "info", label: "INFO", dotColor: "bg-emerald-500" },
    { id: "warn", label: "WARN", dotColor: "bg-amber-500" },
    { id: "error", label: "DANGER / BRUTE", dotColor: "bg-red-500" },
    { id: "security", label: "SECURITY AUDIT", dotColor: "bg-blue-600" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
      {/* Search Input & Reset Button */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari ID pengguna, alamat IP, aksi log (cth: PERUBAHAN_PENGATURAN), atau payload..."
            className="w-full pl-10 pr-24 py-2.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 font-mono transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
              Ctrl+K
            </kbd>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="px-3.5 py-2.5 text-xs font-mono text-slate-600 hover:text-slate-900 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filter</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
        <span className="text-[11px] font-mono text-slate-400 mr-1 uppercase tracking-wider font-semibold">
          Kategori:
        </span>
        {categories.map((c) => {
          const isActive = category === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onCategoryChange(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                isActive
                  ? "bg-blue-600 text-white font-medium shadow-2xs"
                  : "bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Severity Level Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-mono text-slate-400 mr-2 uppercase tracking-wider font-semibold">
          Severity:
        </span>
        {levels.map((lvl) => {
          const isActive = level === lvl.id;
          return (
            <button
              key={lvl.id}
              type="button"
              onClick={() => onLevelChange(lvl.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${lvl.dotColor}`}></span>
              <span>{lvl.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
