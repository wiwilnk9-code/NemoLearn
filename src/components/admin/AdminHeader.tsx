"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Menu,
  Activity,
  Server,
  Sparkles,
} from "lucide-react";
import { User } from "@/types/user";
import { AdminProfileMenu } from "@/components/admin/AdminProfileMenu";
import { AdminNotifications } from "@/components/admin/AdminNotifications";
import { AdminSearchModal } from "@/components/admin/AdminSearchModal";
import { cn } from "@/lib/utils";

interface AdminHeaderProps {
  currentUser?: User | null;
  pendingReportsCount?: number;
  onOpenMobileSidebar?: () => void;
  className?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentUser,
  pendingReportsCount = 0,
  onOpenMobileSidebar,
  className,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xl border-b border-[#E2E8F0] flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all",
          className
        )}
      >
        {/* Left Section: Mobile Menu & Search Input */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Buka Menu Navigasi"
            className="lg:hidden p-2 rounded-xl text-[#475467] hover:text-[#101828] hover:bg-[#F1F5F9] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Interactive Search Bar Trigger */}
          <div
            onClick={() => setIsSearchOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsSearchOpen(true);
              }
            }}
            className="relative w-full flex items-center cursor-pointer group"
          >
            <Search className="absolute left-3 w-4 h-4 text-[#94A3B8] group-hover:text-[#0B559F] transition-colors pointer-events-none" />
            <div className="w-full pl-9 pr-14 py-2 text-xs rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#475467] group-hover:border-[#CBD5E1] group-hover:bg-white transition-all font-mono truncate select-none shadow-xs">
              Cari pengguna, model AI, log audit...
            </div>
            <div className="absolute right-2.5 flex items-center gap-1 pointer-events-none">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[#667085] bg-[#EFF4FF] border border-[#B2DDFF] rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Production Cluster Pill */}
          <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono text-[#475467] bg-[#F8FAFC] border border-[#E2E8F0] whitespace-nowrap shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0FA97A] animate-pulse" />
            <span>Production • ap-southeast-3</span>
          </div>
        </div>

        {/* Right Section: Live Telemetry, Notifications, Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notifications Popover */}
          <AdminNotifications initialCount={pendingReportsCount} />

          {/* Vertical Divider */}
          <div className="h-6 w-px bg-[#E2E8F0] mx-0.5 sm:mx-1" />

          {/* User Profile Menu */}
          <AdminProfileMenu currentUser={currentUser} />
        </div>
      </header>

      {/* Global ⌘K Command Palette Modal */}
      <AdminSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
