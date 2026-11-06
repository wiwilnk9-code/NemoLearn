"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, ExternalLink, Sparkles, BookOpen, Flag, Award, AlertCircle } from "lucide-react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  userId?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications(userId);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!userId) return null;

  const displayedList = filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  const getIcon = (type: string) => {
    switch (type) {
      case "practice":
        return <Award className="w-4 h-4 text-[#16A34A]" />;
      case "report":
        return <Flag className="w-4 h-4 text-[#E11D48]" />;
      case "badge":
        return <Sparkles className="w-4 h-4 text-[#F59E0B]" />;
      case "announcement":
        return <AlertCircle className="w-4 h-4 text-[#2563EB]" />;
      default:
        return <BookOpen className="w-4 h-4 text-[#7957E8]" />;
    }
  };

  const handleNotificationClick = (item: any) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.link) {
      setIsOpen(false);
      router.push(item.link);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
        title="Notifikasi"
        aria-label="Buka notifikasi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#DC2626] rounded-full ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E2E8F0] z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0F172A]">Notifikasi</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#DC2626]/10 text-[#DC2626] rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-[#16A34A] hover:underline flex items-center gap-1 font-semibold"
              >
                <Check className="w-3.5 h-3.5" />
                Tandai semua dibaca
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#F1F5F9] px-4 bg-[#FAF9F5]">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "py-2 px-3 text-xs font-semibold border-b-2 transition-colors",
                filter === "all"
                  ? "border-[#16A34A] text-[#16A34A]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={cn(
                "py-2 px-3 text-xs font-semibold border-b-2 transition-colors",
                filter === "unread"
                  ? "border-[#16A34A] text-[#16A34A]"
                  : "border-transparent text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              Belum Dibaca ({unreadCount})
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#F1F5F9]">
            {displayedList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#94A3B8]">
                Tidak ada notifikasi {filter === "unread" ? "baru" : ""}.
              </div>
            ) : (
              displayedList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    "p-3.5 hover:bg-[#FAF9F5] transition-colors cursor-pointer flex items-start gap-3 text-left",
                    !item.isRead ? "bg-[#F0FDF4]/40" : ""
                  )}
                >
                  <div className="p-2 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-xs font-semibold truncate", !item.isRead ? "text-[#0F172A]" : "text-[#475569]")}>
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#16A34A] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-[#94A3B8]">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
