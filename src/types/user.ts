export type UserRole = "pelajar" | "guru" | "moderator" | "admin" | "owner";

export type AdminPermission =
  | "manage_users"
  | "manage_questions"
  | "manage_sessions"
  | "view_analytics"
  | "manage_ai"
  | "manage_settings"
  | "view_audit_logs";

export interface PermissionDefinition {
  id: AdminPermission;
  label: string;
  description: string;
  category: "manajemen" | "akademik" | "sistem";
}

export const ALL_ADMIN_PERMISSIONS: PermissionDefinition[] = [
  {
    id: "manage_users",
    label: "Manajemen Pengguna & Verifikasi",
    description: "Kelola direktori pengguna, role privilege, dan antrean verifikasi guru.",
    category: "manajemen",
  },
  {
    id: "manage_questions",
    label: "Bank Soal SMA",
    description: "Kelola butir soal, kunci jawaban, dan pembahasan kurikulum SMA.",
    category: "akademik",
  },
  {
    id: "manage_sessions",
    label: "Sesi Ujian & Latihan",
    description: "Pantau pengerjaan kuis real-time, evaluasi skor IRT, dan remediasi.",
    category: "akademik",
  },
  {
    id: "view_analytics",
    label: "Analitik & Telemetri Platform",
    description: "Akses grafik tren pertumbuhan, DAU, retensi siswa, dan metrik aktivitas.",
    category: "manajemen",
  },
  {
    id: "manage_ai",
    label: "AI Provider Engine & Routing",
    description: "Konfigurasi provider AI, routing model, pengujian latency, dan telemetri token.",
    category: "sistem",
  },
  {
    id: "manage_settings",
    label: "Pengaturan Website & Siaran",
    description: "Ubah konfigurasi platform, siaran banner pengumuman, dan mode pemeliharaan.",
    category: "sistem",
  },
  {
    id: "view_audit_logs",
    label: "Log Audit Keamanan & Jejak Forensik",
    description: "Pantau riwayat mutasi akun, upaya login gagal, dan audit log kepatuhan.",
    category: "manajemen",
  },
];

export const DEFAULT_ADMIN_PERMISSIONS: AdminPermission[] = [
  "manage_users",
  "manage_questions",
  "manage_sessions",
  "view_analytics",
  "view_audit_logs",
];

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  permissions?: AdminPermission[];
  school?: string;
  gender?: "laki-laki" | "perempuan" | "rahasia";
  avatarUrl?: string;
  createdAt: string;
  status: "active" | "suspended";
  verificationStatus?: "unverified" | "pending" | "verified" | "rejected";
  nuptk?: string;
  nip?: string;
  subject?: string;
  portfolioUrl?: string;
  verificationNote?: string;
  lastActiveAt?: string;
  // Production Auth & Verification
  passwordHash?: string;
  emailVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpires?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  tosAcceptedAt?: string;
  privacyAcceptedAt?: string;
  tosVersion?: string;
  privacyVersion?: string;
  parentalConsentConfirmed?: boolean;
  authProvider?: "email" | "google" | "supabase";
  // AI Access & Quota Control (Task 3)
  hasAiAccess?: boolean;
  dailyAiQuotaOverride?: number;
  aiAccessGrantedBy?: string;
  aiAccessGrantedAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

