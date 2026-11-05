"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Layers,
  History,
  AlertTriangle,
  Cpu,
  FileText,
  Settings,
  ShieldCheck,
  ArrowLeft,
  X,
  ExternalLink,
  Crown,
  Lock,
  Activity,
} from "lucide-react";
import { User, AdminPermission } from "@/types/user";
import { hasPermission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  currentUser?: User | null;
  pendingReportsCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentUser,
  pendingReportsCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const isOwner = currentUser?.role === "owner";

  // Dismiss mobile drawer on Escape key
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseMobile?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  const navGroups: {
    title: string;
    items: {
      href: string;
      label: string;
      icon: any;
      permission?: AdminPermission;
      badge?: number | null;
    }[];
  }[] = [
    {
      title: "UTAMA",
      items: [
        { href: "/admin", label: "Overview & Analitik", icon: LayoutDashboard },
        { href: "/admin/analytics", label: "Analitik Mendalam", icon: BarChart3, permission: "view_analytics" },
        { href: "/admin/sessions", label: "Sesi Latihan Siswa", icon: History, permission: "manage_sessions" },
      ],
    },
    {
      title: "AKADEMIK & KONTEN",
      items: [
        { href: "/admin/questions", label: "Bank Soal SMA", icon: Layers, permission: "manage_questions" },
        {
          href: "/admin/reports",
          label: "Laporan Butir Soal",
          icon: AlertTriangle,
          permission: "manage_questions",
          badge: pendingReportsCount > 0 ? pendingReportsCount : null,
        },
      ],
    },
    {
      title: "MANAJEMEN & AUDIT",
      items: [
        { href: "/admin/users", label: "Manajemen Pengguna", icon: Users, permission: "manage_users" },
        { href: "/admin/logs", label: "Log Audit Keamanan", icon: FileText, permission: "view_audit_logs" },
      ],
    },
    {
      title: "SISTEM & KONFIGURASI",
      items: [
        { href: "/admin/ai-settings", label: "AI Monitoring & Engine", icon: Cpu, permission: "manage_ai" },
        { href: "/admin/settings", label: "Pengaturan Sistem", icon: Settings, permission: "manage_settings" },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E2E8F0] text-[#101828] select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[#E2E8F0] shrink-0">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center font-bold shadow-xs border",
              isOwner
                ? "bg-[#E9D7FE] text-[#53389E] border-[#D6BBFB]"
                : "bg-[#D1E9FF] text-[#0B559F] border-[#B2DDFF]"
            )}
          >
            {isOwner ? (
              <Crown className="w-4 h-4 text-[#53389E]" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#0B559F]" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-[#101828]">
              NemoLearn
            </span>
            <span
              className={cn(
                "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border font-semibold tracking-wider",
                isOwner
                  ? "bg-[#E9D7FE] text-[#53389E] border-[#D6BBFB]"
                  : "bg-[#D1E9FF] text-[#062C54] border-[#B2DDFF]"
              )}
            >
              {isOwner ? "OWNER" : "ADMIN"}
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#667085] hover:text-[#101828] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-mono uppercase tracking-wider text-[#667085] font-semibold">
              {group.title}
            </p>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const isPermitted =
                  !item.permission || hasPermission(currentUser, item.permission);

                if (!isPermitted) {
                  return (
                    <div
                      key={item.href}
                      title="Memerlukan hak izin dari Platform Owner"
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#94A3B8] opacity-60 cursor-not-allowed select-none"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-[#94A3B8]" />
                        <span>{item.label}</span>
                      </div>
                      <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => onCloseMobile?.()}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all group",
                      isActive
                        ? isOwner
                          ? "bg-[#E9D7FE] text-[#2C1C5F] font-semibold border border-[#D6BBFB] shadow-xs"
                          : "bg-[#D1E9FF] text-[#062C54] font-semibold border border-[#B2DDFF] shadow-xs"
                        : "text-[#475467] hover:text-[#101828] hover:bg-[#F1F5F9]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-transform group-hover:scale-105",
                          isActive
                            ? isOwner
                              ? "text-[#53389E]"
                              : "text-[#0B559F]"
                            : "text-[#667085] group-hover:text-[#101828]"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="px-2 py-0.5 bg-[#F97066] text-white rounded-full text-[10px] font-mono font-bold animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Engine Status & Switch Mode Card */}
      <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-3 shrink-0">
        {/* All Systems Operational indicator */}
        <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0FA97A] animate-pulse" />
              <span className="text-xs font-semibold text-[#0FA97A]">
                All Systems Operational
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#667085] px-1.5 py-0.5 rounded bg-[#F1F5F9]">
              99.98%
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#475467] pt-1 border-t border-[#F1F5F9]">
            <span className="font-mono">Core Engine</span>
            <span className="font-mono px-1.5 py-0.2 rounded bg-[#EFF4FF] text-[#0B559F] font-semibold">
              v2.4.0
            </span>
          </div>
        </div>

        {/* Back to student dashboard button */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-white hover:bg-[#F1F5F9] text-xs font-semibold text-[#334155] hover:text-[#101828] border border-[#E2E8F0] transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#0FA97A]" />
          <span>Kembali ke Beranda Siswa</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile / Tablet Off-canvas Drawer */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={onCloseMobile}
          />
          {/* Drawer Pane */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-scale-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
