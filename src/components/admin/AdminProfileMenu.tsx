"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Crown,
  ShieldCheck,
  ChevronDown,
  Settings,
  Users,
  LogOut,
  ArrowLeft,
  ExternalLink,
  Shield,
  Key,
} from "lucide-react";
import { User } from "@/types/user";
import { cn } from "@/lib/utils";

interface AdminProfileMenuProps {
  currentUser?: User | null;
  className?: string;
}

export const AdminProfileMenu: React.FC<AdminProfileMenuProps> = ({
  currentUser,
  className,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  const isOwner = currentUser?.role === "owner";
  const userInitial = currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : "U";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue redirect even if network fails
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  };

  if (!currentUser) return null;

  return (
    <div className={cn("relative inline-block text-left", className)} ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={cn(
          "flex items-center gap-3 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all text-left group",
          isOpen
            ? "bg-[#EFF4FF] border-[#B2DDFF] ring-2 ring-[#0B559F]/20"
            : "bg-white hover:bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]"
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border shadow-xs transition-transform group-hover:scale-105",
            isOwner
              ? "bg-[#E9D7FE] text-[#53389E] border-[#D6BBFB]"
              : "bg-[#D1E9FF] text-[#0B559F] border-[#B2DDFF]"
          )}
        >
          {isOwner ? (
            <Crown className="w-4 h-4 text-[#53389E]" />
          ) : (
            <span>{userInitial}</span>
          )}
        </div>

        {/* User Details (Desktop) */}
        <div className="hidden md:flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#101828] truncate max-w-[140px] leading-tight">
              {currentUser.displayName}
            </span>
            <span
              className={cn(
                "text-[9px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border",
                isOwner
                  ? "bg-[#E9D7FE] text-[#53389E] border-[#D6BBFB]"
                  : "bg-[#D1E9FF] text-[#0B559F] border-[#B2DDFF]"
              )}
            >
              {isOwner ? "OWNER" : "ADMIN"}
            </span>
          </div>
          <span className="text-[10px] text-[#475467] font-mono leading-tight mt-0.5 truncate max-w-[140px]">
            {isOwner ? "Platform Owner / Superadmin" : "System Administrator"}
          </span>
        </div>

        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#667085] transition-transform duration-200",
            isOpen && "rotate-180 text-[#0B559F]"
          )}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E2E8F0] shadow-sapphire-dropdown z-50 overflow-hidden animate-scale-in"
        >
          {/* Header Card */}
          <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border shadow-xs",
                  isOwner
                    ? "bg-[#E9D7FE] text-[#53389E] border-[#D6BBFB]"
                    : "bg-[#D1E9FF] text-[#0B559F] border-[#B2DDFF]"
                )}
              >
                {isOwner ? (
                  <Crown className="w-5 h-5 text-[#53389E]" />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#101828] truncate">
                  {currentUser.displayName}
                </p>
                <p className="text-[11px] text-[#475467] font-mono truncate">
                  {currentUser.email}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1",
                      isOwner
                        ? "bg-[#E9D7FE] text-[#53389E] border-[#D6BBFB]"
                        : "bg-[#D1E9FF] text-[#0B559F] border-[#B2DDFF]"
                    )}
                  >
                    {isOwner ? (
                      <>
                        <Crown className="w-2.5 h-2.5" />
                        Root Owner
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Administrator
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Permission status */}
            <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-mono text-[#475467]">
              <span>Hak Otorisasi:</span>
              <span className="font-semibold text-[#0B559F]">
                {isOwner
                  ? "Hak Penuh (7/7)"
                  : `${currentUser.permissions?.length ?? 5}/7 Izin Diberikan`}
              </span>
            </div>
          </div>

          {/* Quick Menu Links */}
          <div className="p-2 space-y-1 text-xs">
            {isOwner && (
              <Link
                href="/admin/users"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#334155] hover:text-[#101828] hover:bg-[#F1F5F9] transition-colors"
              >
                <Key className="w-4 h-4 text-[#53389E]" />
                <span>Kelola Izin & Akses Admin</span>
              </Link>
            )}

            <Link
              href="/admin/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#334155] hover:text-[#101828] hover:bg-[#F1F5F9] transition-colors"
            >
              <Settings className="w-4 h-4 text-[#0B559F]" />
              <span>Pengaturan Platform</span>
            </Link>

            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-[#334155] hover:text-[#101828] hover:bg-[#F1F5F9] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ArrowLeft className="w-4 h-4 text-[#0FA97A]" />
                <span>Beralih ke Portal Siswa</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#94A3B8]" />
            </Link>
          </div>

          {/* Logout Action */}
          <div className="p-2 border-t border-[#E2E8F0] bg-[#FAF9F5]">
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-[#D92D20] hover:bg-[#FEE4E2] transition-colors text-left disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? "Mengakhiri Sesi..." : "Keluar dari Admin"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
