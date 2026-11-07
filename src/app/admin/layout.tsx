import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { ReportRepository } from "@/lib/db";
import { AdminAuthGuardClient } from "@/components/admin/AdminAuthGuardClient";

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
  const pendingCount = ReportRepository.getPendingCount();

  return (
    <AdminAuthGuardClient
      currentUser={currentUser}
      pendingReportsCount={pendingCount}
    >
      {children}
    </AdminAuthGuardClient>
  );
}
