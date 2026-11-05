"use client";

import React, { useState } from "react";
import { User } from "@/types/user";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminToastContainer } from "@/components/admin/ui/AdminToast";

interface AdminLayoutClientProps {
  currentUser: User;
  pendingReportsCount: number;
  children: React.ReactNode;
}

export const AdminLayoutClient: React.FC<AdminLayoutClientProps> = ({
  currentUser,
  pendingReportsCount,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#EEF3F9] text-[#101828] flex flex-col antialiased">
      {/* Sidebar Navigation (Desktop fixed + Mobile drawer) */}
      <AdminSidebar
        currentUser={currentUser}
        pendingReportsCount={pendingReportsCount}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Column (Offset by sidebar width on desktop) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Sticky Dashboard Header */}
        <AdminHeader
          currentUser={currentUser}
          pendingReportsCount={pendingReportsCount}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Content Container */}
        <main className="flex-1 flex flex-col bg-[#EEF3F9]">
          {children}
        </main>
      </div>

      {/* Global Toast Container */}
      <AdminToastContainer />
    </div>
  );
};
