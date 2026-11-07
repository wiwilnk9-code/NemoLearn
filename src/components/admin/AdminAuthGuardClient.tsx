"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { User } from "@/types/user";
import { AdminLayoutClient } from "./AdminLayoutClient";
import { AdminAccessGuard } from "./AdminAccessGuard";

interface AdminAuthGuardClientProps {
  currentUser: User | null;
  pendingReportsCount: number;
  children: React.ReactNode;
}

export const AdminAuthGuardClient: React.FC<AdminAuthGuardClientProps> = ({
  currentUser,
  pendingReportsCount,
  children,
}) => {
  const pathname = usePathname();

  // Route /admin/login is the dedicated authentication gateway for admins & owners.
  // It MUST render freely without being intercepted by the 403 Forbidden guard.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const isAllowed =
    currentUser && (currentUser.role === "admin" || currentUser.role === "owner");

  // Non-admin / non-owner visitors attempting to access protected dashboard routes (/admin, /admin/users, etc.)
  // are denied access and shown the 403 Forbidden Access Guard.
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-[#EEF3F9]">
        <AdminAccessGuard currentUser={currentUser} loading={false} />
      </div>
    );
  }

  return (
    <AdminLayoutClient
      currentUser={currentUser}
      pendingReportsCount={pendingReportsCount}
    >
      {children}
    </AdminLayoutClient>
  );
};
