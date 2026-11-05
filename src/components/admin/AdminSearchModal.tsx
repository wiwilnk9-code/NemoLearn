"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  BarChart3,
  Users,
  Layers,
  History,
  AlertTriangle,
  Cpu,
  FileText,
  Settings,
  ArrowRight,
  UserPlus,
  Terminal,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultItem {
  id: string;
  title: string;
  category: "Modul Utama" | "Fitur & Aksi" | "Sistem & Keamanan";
  icon: any;
  href: string;
  badge?: string;
}

const SEARCHABLE_ITEMS: SearchResultItem[] = [
  {
    id: "overview",
    title: "Overview & Analitik Eksekutif",
    category: "Modul Utama",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    id: "analytics",
    title: "Analitik Pertumbuhan & Retensi",
    category: "Modul Utama",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    id: "users",
    title: "Manajemen Pengguna & Verifikasi Guru",
    category: "Modul Utama",
    icon: Users,
    href: "/admin/users",
    badge: "18 Verifikasi",
  },
  {
    id: "new-user",
    title: "Tambah Pengguna Baru (Registrasi Manual)",
    category: "Fitur & Aksi",
    icon: UserPlus,
    href: "/admin/users",
  },
  {
    id: "questions",
    title: "Bank Soal Kurikulum SMA (Fisika, Kimia, dll)",
    category: "Modul Utama",
    icon: Layers,
    href: "/admin/questions",
  },
  {
    id: "sessions",
    title: "Sesi Latihan Siswa & Riwayat Kuis",
    category: "Modul Utama",
    icon: History,
    href: "/admin/sessions",
  },
  {
    id: "reports",
    title: "Antrean Laporan Butir Soal Bermasalah",
    category: "Modul Utama",
    icon: AlertTriangle,
    href: "/admin/reports",
  },
  {
    id: "ai-settings",
    title: "AI Provider Monitoring & Konfigurasi Token",
    category: "Sistem & Keamanan",
    icon: Cpu,
    href: "/admin/ai-settings",
  },
  {
    id: "logs",
    title: "Log Audit Keamanan & Forensik Akses",
    category: "Sistem & Keamanan",
    icon: FileText,
    href: "/admin/logs",
  },
  {
    id: "settings",
    title: "Pengaturan Platform & Kebijakan Sistem",
    category: "Sistem & Keamanan",
    icon: Settings,
    href: "/admin/settings",
  },
];

interface AdminSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminSearchModal: React.FC<AdminSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredItems = query.trim()
    ? SEARCHABLE_ITEMS.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCHABLE_ITEMS;

  // Keyboard navigation inside search results
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(filteredItems.length, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? filteredItems.length - 1 : prev - 1
        );
      } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
        e.preventDefault();
        router.push(filteredItems[selectedIndex].href);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose, router]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 border-b border-[#E2E8F0]">
          <Search className="w-5 h-5 text-[#94A3B8] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Cari modul, pengguna, model AI, log sistem... (cth: users, audit, kuis)"
            className="w-full py-4 pl-3 pr-8 text-sm text-[#101828] placeholder:text-[#94A3B8] focus:outline-none bg-transparent font-sans"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-[#94A3B8] hover:text-[#101828] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-2 py-0.5 text-[10px] font-mono text-[#667085] bg-[#F1F5F9] border border-[#CBD5E1] rounded">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-[#667085]">
              <Search className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#101828]">Tidak ada hasil untuk &quot;{query}&quot;</p>
              <p className="text-[11px] text-[#667085] mt-1">
                Coba kata kunci lain seperti &quot;AI&quot;, &quot;Pengguna&quot;, atau &quot;Bank Soal&quot;.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs cursor-pointer transition-colors group",
                    isSelected
                      ? "bg-[#D1E9FF] text-[#062C54]"
                      : "text-[#334155] hover:bg-[#F8FAFC]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isSelected
                          ? "bg-white text-[#0B559F] shadow-xs"
                          : "bg-[#F1F5F9] text-[#475467] group-hover:bg-white group-hover:text-[#0B559F]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{item.title}</p>
                      <p
                        className={cn(
                          "text-[10px] font-mono",
                          isSelected ? "text-[#062C54]/80" : "text-[#667085]"
                        )}
                      >
                        {item.category}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E9D7FE] text-[#53389E]">
                        {item.badge}
                      </span>
                    )}
                    <ArrowRight
                      className={cn(
                        "w-3.5 h-3.5 transition-transform",
                        isSelected
                          ? "translate-x-0.5 text-[#062C54]"
                          : "opacity-0 group-hover:opacity-100 text-[#94A3B8]"
                      )}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono text-[#667085]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-[#CBD5E1] rounded text-[10px]">↑</kbd>{" "}
              <kbd className="px-1.5 py-0.5 bg-white border border-[#CBD5E1] rounded text-[10px]">↓</kbd> Navigasi
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white border border-[#CBD5E1] rounded text-[10px]">↵</kbd> Buka
            </span>
          </div>
          <span>NemoLearn IAM Console</span>
        </div>
      </div>
    </div>
  );
};
