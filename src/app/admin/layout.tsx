import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { ReportRepository } from "@/lib/db";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { AdminAccessGuard } from "@/components/admin/AdminAccessGuard";

export const metadata = {
  title: "Admin Dashboard — NemoLearn",
  description: "Panel Kontrol Administrator & Owner NemoLearn untuk manajemen pengguna, bank soal, sesi kuis, dan AI.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const isAllowed = currentUser && (currentUser.role === "admin" || currentUser.role === "owner");

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-[#EEF3F9]">
        <AdminAccessGuard currentUser={currentUser} loading={false} />
      </div>
    );
  }

  const pendingCount = ReportRepository.getPendingCount();

  return (
    <AdminLayoutClient
      currentUser={currentUser}
      pendingReportsCount={pendingCount}
    >
      {children}
    </AdminLayoutClient>
  );
}
