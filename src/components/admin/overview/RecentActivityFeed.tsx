"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  UserPlus,
  ShieldCheck,
  Cpu,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { SystemLog } from "@/types/admin";
import { cn } from "@/lib/utils";

interface RecentActivityFeedProps {
  recentSessions?: Array<{
    id: string;
    userId: string;
    userName: string;
    subjectName: string;
    topicId: string;
    status: string;
    scoreFormatted?: string | null;
    scoringMethod?: string | null;
    completedAt?: string;
    startedAt: string;
  }>;
  recentLogs?: SystemLog[];
  className?: string;
}

interface UnifiedActivityItem {
  id: string;
  type: "session" | "user" | "audit" | "ai";
  title: string;
  description: string;
  timeFormatted: string;
  badge: string;
  badgeColor: "blue" | "emerald" | "purple" | "amber";
  timestamp: string;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  recentSessions = [],
  recentLogs = [],
  className,
}) => {
  // Format Indonesian relative/clock time
  const formatTime = (isoString?: string) => {
    if (!isoString) return "Baru saja";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB";
    } catch {
      return "Baru saja";
    }
  };

  // Convert sessions into feed items
  const sessionItems: UnifiedActivityItem[] = recentSessions.map((s) => ({
    id: `sess-${s.id}`,
    type: "session",
    title: `Sesi Latihan: ${s.userName || "Siswa SMA"}`,
    description: `Menyelesaikan materi ${s.subjectName || "SMA"} (Materi: ${s.topicId || "Umum"})${
      s.scoreFormatted ? ` dengan capaian skor ${s.scoreFormatted}` : ""
    }.`,
    timeFormatted: formatTime(s.completedAt || s.startedAt),
    badge: s.status === "completed" ? "Sesi Selesai" : "Sedang Berjalan",
    badgeColor: s.status === "completed" ? "emerald" : "blue",
    timestamp: s.completedAt || s.startedAt || new Date().toISOString(),
  }));

  // Convert logs into feed items
  const logItems: UnifiedActivityItem[] = recentLogs.map((l) => {
    const isSecurity = l.level === "security" || l.level === "warn";
    const isError = l.level === "error";

    return {
      id: `log-${l.id}`,
      type: l.action.toLowerCase().includes("ai") ? "ai" : "audit",
      title: l.action.replace(/_/g, " "),
      description: l.details || `Tindakan dieksekusi oleh ${l.actorEmail}.`,
      timeFormatted: formatTime(l.timestamp),
      badge: isSecurity ? "Keamanan" : isError ? "Error" : "Audit Admin",
      badgeColor: isSecurity ? "amber" : isError ? "amber" : "purple",
      timestamp: l.timestamp,
    };
  });

  // Combine and sort chronologically (most recent first)
  const combinedItems = [...sessionItems, ...logItems]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  const getIcon = (type: UnifiedActivityItem["type"]) => {
    switch (type) {
      case "session":
        return <BookOpen className="w-4 h-4 text-[#0FA97A]" />;
      case "audit":
        return <ShieldCheck className="w-4 h-4 text-[#53389E]" />;
      case "ai":
        return <Cpu className="w-4 h-4 text-[#0B559F]" />;
      case "user":
      default:
        return <UserPlus className="w-4 h-4 text-[#067BC2]" />;
    }
  };

  const getBadgeStyle = (color: UnifiedActivityItem["badgeColor"]) => {
    switch (color) {
      case "emerald":
        return "bg-[#D1FADF] text-[#054F38] border-[#A6F4C5]";
      case "purple":
        return "bg-[#E9D7FE] text-[#2C1C5F] border-[#D6BBFB]";
      case "amber":
        return "bg-[#FFFBEB] text-[#7A271A] border-[#FDE68A]";
      case "blue":
      default:
        return "bg-[#D1E9FF] text-[#062C54] border-[#B2DDFF]";
    }
  };

  return (
    <div
      className={cn(
        "bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-6 shadow-sapphire-card flex flex-col justify-between transition-all",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#0FA97A] animate-pulse" />
          <h2 className="text-base font-bold text-[#101828]">
            Aktivitas Harian Terkini & Peringatan Sistem
          </h2>
        </div>
        <Link
          href="/admin/logs"
          className="text-xs font-mono text-[#0B559F] hover:underline flex items-center gap-1 font-semibold"
        >
          <span>Lihat Log Penuh</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Feed Items List */}
      <div className="space-y-3 flex-1">
        {combinedItems.length === 0 ? (
          <div className="py-12 text-center text-[#667085] space-y-2">
            <Clock className="w-8 h-8 text-[#CBD5E1] mx-auto" />
            <p className="text-xs font-semibold text-[#101828]">Belum Ada Aktivitas Terkini</p>
            <p className="text-[11px] text-[#667085]">
              Sesi belajar, registrasi baru, dan log audit akan ditampilkan di sini.
            </p>
          </div>
        ) : (
          combinedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3.5 p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-transparent hover:border-[#B2DDFF] transition-all group"
            >
              {/* Type Icon */}
              <span className="p-2 rounded-lg bg-white border border-[#E2E8F0] shrink-0 mt-0.5 shadow-xs">
                {getIcon(item.type)}
              </span>

              {/* Title & Description */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#101828] truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#667085] shrink-0">
                    {item.timeFormatted}
                  </span>
                </div>
                <p className="text-xs text-[#475467] mt-0.5 line-clamp-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Category Pill */}
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border shrink-0 self-center hidden sm:inline-block",
                  getBadgeStyle(item.badgeColor)
                )}
              >
                {item.badge}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
