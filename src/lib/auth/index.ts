/**
 * NemoLearn Authentication Hub
 * Mengekspor seluruh fungsi autentikasi server dan shared permissions.
 * File ini digunakan oleh Server Components, Route Handlers (API), dan modul backend lainnya.
 * 
 * CATATAN PENTING BOUNDARY:
 * Komponen Client ("use client") HARUS mengimpor dari:
 * - `@/lib/auth/permissions` (untuk hasPermission, isAdmin, isOwner)
 * - `@/lib/auth/client` (untuk fetchCurrentUser, clientLogin, clientLogout)
 * Jangan mengimpor modul server ini di dalam file Client Component.
 */

export * from "./permissions";
export * from "./server";
