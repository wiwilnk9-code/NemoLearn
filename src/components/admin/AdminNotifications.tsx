"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  UserCheck,
  Zap,
  ShieldAlert,
  Info,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminNotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "warning" | "success" | "info" | "security";
  unread: boolean;
  link?: string;
}

const DEFAULT_NOTIFICATIONS: AdminNotificationItem[] = [
  {
    id: "notif-1",
    title: "18 Verifikasi Pengajar Menunggu",
    description: "Permohonan verifikasi sertifikasi NUPTK & portofolio guru baru perlu ditinjau.",
    time: "5m yang lalu",
    type: "info",
    unread: true,
    link: "/admin/users",
  },
  {
    id: "notif-2",
    title: "Puncak Trafik AI Quiz Generator",
    description: "Volume generator latihan melonjak hingga 4,200 req/menit pada jam belajar mandiri.",
    time: "24m yang lalu",
    type: "warning",
    unread: true,
    link: "/admin/ai-settings",
  },
  {
    id: "notif-3",
    title: "3 Alamat IP Diblokir Otomatis",
    description: "Sistem mitigasi brute-force memblokir percobaan login berulang yang mencurigakan.",
    time: "1j yang lalu",
    type: "security",
    unread: true,
    link: "/admin/logs",
  },
  {
    id: "notif-4",
    title: "Laporan Butir Soal Terkirim",
    description: "Siswa melaporkan kemungkinan salah ketik pada kunci jawaban Fisika Gelombang.",
    time: "3j yang lalu",
    type: "warning",
    unread: false,
    link: "/admin/reports",
  },
];

interface AdminNotificationsProps {
  initialCount?: number;
  className?: string;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({
  initialCount,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((n) => n.unread).length;

  // Close on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const markAllAsRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const markAsRead = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
  };

  const filteredItems = items.filter((item) => (filter === "unread" ? item.unread : true));

  const getTypeIcon = (type: AdminNotificationItem["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-[#D97706]" />;
      case "security":
        return <ShieldAlert className="w-4 h-4 text-[#D92D20]" />;
      case "success":
        return <UserCheck className="w-4 h-4 text-[#0FA97A]" />;
      case "info":
      default:
        return <Zap className="w-4 h-4 text-[#0B559F]" />;
    }
  };

  const getTypeBg = (type: AdminNotificationItem["type"]) => {
    switch (type) {
      case "warning":
        return "bg-[#FFFBEB] border-[#FDE68A]";
      case "security":
        return "bg-[#FEE4E2] border-[#FECDCA]";
      case "success":
        return "bg-[#D1FADF] border-[#A6F4C5]";
      case "info":
      default:
        return "bg-[#D1E9FF] border-[#B2DDFF]";
    }
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pemberitahuan Sistem"
        aria-expanded={isOpen}
        className={cn(
          "relative p-2 rounded-xl text-[#475467] hover:text-[#101828] hover:bg-[#F1F5F9] border border-transparent transition-all",
          isOpen && "bg-[#F1F5F9] text-[#0B559F] border-[#E2E8F0]"
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97066] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D92D20]" />
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-[#E2E8F0] shadow-sapphire-dropdown z-50 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#101828]">Pemberitahuan Sistem</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D1E9FF] text-[#062C54]">
                  {unreadCount} Baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-[#0B559F] hover:text-[#094582] flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-2 bg-white border-b border-[#E2E8F0] flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors",
                filter === "all"
                  ? "bg-[#D1E9FF] text-[#062C54] font-semibold"
                  : "text-[#475467] hover:bg-[#F1F5F9]"
              )}
            >
              Semua ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors",
                filter === "unread"
                  ? "bg-[#D1E9FF] text-[#062C54] font-semibold"
                  : "text-[#475467] hover:bg-[#F1F5F9]"
              )}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* Items List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E2E8F0]">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-[#667085] space-y-1">
                <CheckCheck className="w-8 h-8 text-[#0FA97A] mx-auto opacity-75" />
                <p className="text-xs font-semibold text-[#101828] mt-2">Semua Notifikasi Selesai</p>
                <p className="text-[11px] text-[#667085]">Tidak ada notifikasi yang belum ditinjau.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={cn(
                    "p-3.5 transition-colors flex items-start gap-3 hover:bg-[#F8FAFC] cursor-pointer group",
                    item.unread ? "bg-[#F8FAFC]/80" : "bg-white opacity-85"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5",
                      getTypeBg(item.type)
                    )}
                  >
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn("text-xs font-semibold truncate", item.unread ? "text-[#101828]" : "text-[#475467]")}>
                        {item.title}
                      </p>
                      <span className="text-[10px] font-mono text-[#667085] shrink-0">
                        {item.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475467] mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    {item.link && (
                      <Link
                        href={item.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-[#0B559F] hover:underline mt-1.5"
                      >
                        <span>Tinjau Modul</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  {item.unread && (
                    <span className="w-2 h-2 rounded-full bg-[#0B559F] shrink-0 self-center" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] text-center">
            <Link
              href="/admin/logs"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-[#0B559F] hover:underline"
            >
              Lihat Seluruh Riwayat Log Audit →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
