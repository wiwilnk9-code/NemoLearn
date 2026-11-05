"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminBreadcrumbProps {
  items?: BreadcrumbItem[];
  subsystemTag?: string;
  pulseLive?: boolean;
  className?: string;
}

const PATH_NAME_MAP: Record<string, { title: string; tag: string }> = {
  "/admin": { title: "Overview & Analitik", tag: "LIVE TELEMETRY" },
  "/admin/analytics": { title: "Analitik Mendalam", tag: "METRICS_V2" },
  "/admin/users": { title: "Manajemen Pengguna", tag: "DIR_ACCESS_V2" },
  "/admin/questions": { title: "Bank Soal SMA", tag: "CURRICULUM_BANK" },
  "/admin/sessions": { title: "Sesi Latihan Siswa", tag: "STUDY_SESSIONS" },
  "/admin/reports": { title: "Laporan Butir Soal", tag: "REPORT_QUEUE" },
  "/admin/ai-settings": { title: "AI Monitoring & Engine", tag: "AI_TELEMETRY" },
  "/admin/logs": { title: "Log Audit Keamanan", tag: "AUDIT_SUBSYSTEM // SEC-09" },
  "/admin/settings": { title: "Pengaturan Sistem", tag: "CONFIG_CORE // SYS-01" },
};

export const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({
  items,
  subsystemTag,
  pulseLive = false,
  className,
}) => {
  const pathname = usePathname();

  // If items not provided, construct from path
  const currentPathInfo = PATH_NAME_MAP[pathname] || {
    title: pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Admin",
    tag: "CONSOLE",
  };

  const finalTag = subsystemTag || currentPathInfo.tag;
  const isOverview = pathname === "/admin";

  return (
    <nav
      aria-label="Admin Breadcrumb"
      className={cn(
        "flex flex-wrap items-center gap-2 text-xs font-mono select-none",
        className
      )}
    >
      {/* Subsystem Tag / Telemetry Badge */}
      {finalTag && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#D1E9FF] text-[#062C54] border border-[#B2DDFF]">
          {(pulseLive || finalTag.includes("LIVE")) && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#0B559F] animate-pulse" />
          )}
          <span>{finalTag}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[#667085]">
        <Link
          href="/admin"
          className="flex items-center gap-1 text-[#475467] hover:text-[#0B559F] transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Admin</span>
        </Link>

        {!isOverview && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
            {items && items.length > 0 ? (
              items.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-[#475467] hover:text-[#0B559F] transition-colors truncate max-w-[150px]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-[#101828] font-semibold truncate max-w-[200px]">
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              ))
            ) : (
              <span className="text-[#101828] font-semibold truncate max-w-[240px]">
                {currentPathInfo.title}
              </span>
            )}
          </>
        )}
      </div>
    </nav>
  );
};
