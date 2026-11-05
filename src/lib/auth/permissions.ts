/**
 * NemoLearn Authentication & Authorization - Shared Permissions Logic
 * Murni berisi logika verifikasi role dan permission tanpa ketergantungan server (next/headers, crypto, fs).
 * Aman diimpor dan digunakan di Client Component ("use client") maupun Server Component.
 */

import { User, UserRole, AdminPermission, DEFAULT_ADMIN_PERMISSIONS } from "@/types/user";

export type { User, UserRole, AdminPermission };
export { DEFAULT_ADMIN_PERMISSIONS };

/**
 * Mengevaluasi apakah seorang user memiliki izin administratif granular tertentu.
 * Aturan Least-Privilege & RBAC:
 * 1. User non-aktif atau null/undefined: TIDAK MEMILIKI IZIN (false).
 * 2. Role "owner": Memiliki SELURUH izin administratif secara inheren (true).
 * 3. Role "admin": Memiliki izin sesuai array `user.adminPermissions` atau `DEFAULT_ADMIN_PERMISSIONS`.
 * 4. Role "guru", "pelajar", atau role lainnya: TIDAK MEMILIKI IZIN administratif (false).
 */
export function hasPermission(
  user: User | null | undefined,
  permission: AdminPermission
): boolean {
  if (!user || user.status !== "active") return false;
  if (user.role === "owner") return true;
  if (user.role !== "admin") return false;

  const perms = user.permissions || DEFAULT_ADMIN_PERMISSIONS;
  return perms.includes(permission);
}

/**
 * Memeriksa apakah user adalah Administrator platform (admin atau owner aktif).
 */
export function isAdmin(user?: User | null): boolean {
  if (!user || user.status !== "active") return false;
  return user.role === "admin" || user.role === "owner";
}

/**
 * Memeriksa apakah user adalah Superadmin / Platform Owner.
 */
export function isOwner(user?: User | null): boolean {
  if (!user || user.status !== "active") return false;
  return user.role === "owner";
}

/**
 * Memeriksa apakah user berhak membuka dashboard administratif NemoLearn.
 */
export function canAccessAdminDashboard(user?: User | null): boolean {
  return isAdmin(user);
}
