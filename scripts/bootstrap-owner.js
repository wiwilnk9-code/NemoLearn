#!/usr/bin/env node
/**
 * ==============================================================================
 * NEMOLEARN — ONE-TIME SECURE OWNER BOOTSTRAP SCRIPT
 * ==============================================================================
 * Script administratif satu kali untuk menetapkan akun terdaftar sebagai Owner
 * utama platform NemoLearn secara aman melalui Supabase Admin API.
 *
 * Jaminan Keamanan:
 * 1. Tidak membuat akun duplikat (menggunakan akun yang sudah terdaftar di Supabase Auth).
 * 2. Mencari target akun secara presisi berdasarkan OWNER_EMAIL.
 * 3. Memverifikasi bahwa akun ditemukan tepat 1 kali (mencegah ambiguitas).
 * 4. Menyimpan role pada app_metadata (otorisasi server-side aman), bukan user_metadata.
 * 5. Memperbarui tabel public.users dan mencatat log audit pada public.system_logs.
 * 6. Tidak mengubah kata sandi, email, atau status verifikasi email.
 * 7. Memerlukan konfirmasi interaktif eksplisit ("YA") sebelum menerapkan perubahan.
 * 8. Mendukung opsi rollback/revert jika ingin mengembalikan role akun.
 *
 * Penggunaan:
 *   node scripts/bootstrap-owner.js
 *   npm run bootstrap:owner
 *   OWNER_EMAIL=anda@domain.com SUPABASE_SERVICE_ROLE_KEY=ey... npm run bootstrap:owner
 *   npm run bootstrap:owner -- --email=anda@domain.com
 *   npm run bootstrap:owner -- --dry-run
 *   npm run bootstrap:owner -- --revert=pelajar
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { createClient } = require("@supabase/supabase-js");

// Daftar permission lengkap untuk Owner platform NemoLearn
const ALL_ADMIN_PERMISSION_IDS = [
  "manage_users",
  "manage_questions",
  "manage_sessions",
  "view_analytics",
  "manage_ai",
  "manage_settings",
  "view_audit_logs",
];

const DEFAULT_ADMIN_PERMISSION_IDS = [
  "manage_users",
  "manage_questions",
  "manage_sessions",
  "view_analytics",
  "view_audit_logs",
];

/**
 * Helper sederhana untuk membaca file .env tanpa dependency eksternal
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

/**
 * Memuat konfigurasi environment dengan hirarki:
 * 1. CLI Arguments (tertinggi)
 * 2. process.env
 * 3. .env.local
 * 4. .env
 */
function loadConfiguration(args) {
  const rootDir = path.resolve(__dirname, "..");
  const envLocal = parseEnvFile(path.join(rootDir, ".env.local"));
  const envStandard = parseEnvFile(path.join(rootDir, ".env"));

  const getEnv = (key) => process.env[key] || envLocal[key] || envStandard[key] || "";

  // Parse CLI args
  const parsedArgs = {
    email: "",
    serviceRoleKey: "",
    supabaseUrl: "",
    role: "owner",
    isRevert: false,
    isDryRun: false,
    autoConfirm: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("--email=")) {
      parsedArgs.email = arg.split("=")[1].trim();
    } else if (arg === "--email" && args[i + 1]) {
      parsedArgs.email = args[++i].trim();
    } else if (arg.startsWith("--key=")) {
      parsedArgs.serviceRoleKey = arg.split("=")[1].trim();
    } else if (arg === "--key" && args[i + 1]) {
      parsedArgs.serviceRoleKey = args[++i].trim();
    } else if (arg.startsWith("--url=")) {
      parsedArgs.supabaseUrl = arg.split("=")[1].trim();
    } else if (arg === "--url" && args[i + 1]) {
      parsedArgs.supabaseUrl = args[++i].trim();
    } else if (arg === "--dry-run") {
      parsedArgs.isDryRun = true;
    } else if (arg === "--yes" || arg === "-y") {
      parsedArgs.autoConfirm = true;
    } else if (arg.startsWith("--revert=")) {
      parsedArgs.isRevert = true;
      parsedArgs.role = arg.split("=")[1].trim() || "pelajar";
    } else if (arg === "--revert") {
      parsedArgs.isRevert = true;
      parsedArgs.role = (args[i + 1] && !args[i + 1].startsWith("-")) ? args[++i].trim() : "pelajar";
    } else if (arg.startsWith("--role=")) {
      parsedArgs.role = arg.split("=")[1].trim();
    }
  }

  const email = parsedArgs.email || getEnv("OWNER_EMAIL");
  const serviceRoleKey = parsedArgs.serviceRoleKey || getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl =
    parsedArgs.supabaseUrl ||
    getEnv("SUPABASE_URL") ||
    getEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    "https://epbepzjheexkeqivcoql.supabase.co";

  return {
    email,
    serviceRoleKey,
    supabaseUrl,
    targetRole: parsedArgs.role,
    isRevert: parsedArgs.isRevert,
    isDryRun: parsedArgs.isDryRun,
    autoConfirm: parsedArgs.autoConfirm,
  };
}

function printHelp() {
  console.log(`
NemoLearn Owner Account Bootstrap Tool
=======================================
Gunakan script ini untuk menetapkan akun yang sudah terdaftar sebagai Owner utama.

PENGGUNAAN:
  node scripts/bootstrap-owner.js [opsi]
  npm run bootstrap:owner [opsi]

OPSI:
  --email=<email>         Email akun target yang terdaftar di Supabase Auth.
                          (Bisa juga melalui env var OWNER_EMAIL)
  --key=<service-role>    Supabase Service Role Key (server-side secret).
                          (Bisa juga melalui env var SUPABASE_SERVICE_ROLE_KEY)
  --url=<url>             Supabase Project URL (default diambil dari konfigurasi)
  --dry-run               Simulasi pengecekan tanpa mengubah data apa pun.
  --yes, -y               Konfirmasi otomatis tanpa prompt interaktif.
  --revert[=<role>]       Kembalikan role akun (default: 'pelajar', opsi: 'guru', 'admin', dll).
  --help, -h              Tampilkan panduan ini.

CONTOH:
  # Interaktif (akan menanyakan jika env belum ada)
  npm run bootstrap:owner

  # Non-interaktif dengan variabel lingkungan
  OWNER_EMAIL="user@example.com" npm run bootstrap:owner -- --yes

  # Uji coba simulasi tanpa modifikasi
  npm run bootstrap:owner -- --email="user@example.com" --dry-run

  # Rollback / Demote kembali ke pelajar
  npm run bootstrap:owner -- --email="user@example.com" --revert=pelajar
`);
}

/**
 * Prompt interaktif via readline
 */
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer ? answer.trim() : "");
    });
  });
}

/**
 * Mask string rahasia untuk log terminal aman
 */
function maskSecret(str) {
  if (!str) return "(tidak ada)";
  if (str.length <= 8) return "********";
  return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
}

async function main() {
  console.log("\n================================================================================");
  console.log("             NEMOLEARN — BOOTSTRAP OWNER ACCOUNT INITIALIZER                    ");
  console.log("================================================================================\n");

  const config = loadConfiguration(process.argv.slice(2));

  let { email, serviceRoleKey, supabaseUrl, targetRole, isRevert, isDryRun, autoConfirm } = config;

  // 1. Validasi & Pengambilan Email Target
  if (!email) {
    if (process.stdin.isTTY) {
      email = await askQuestion("Masukkan email akun Supabase yang akan dijadikan Owner: ");
    }
  }

  if (!email || !email.includes("@")) {
    console.error("❌ ERROR: Email akun target wajib ditentukan!");
    console.error("Gunakan flag --email=<email> atau set variabel lingkungan OWNER_EMAIL.\n");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // 2. Validasi & Pengambilan Supabase Service Role Key
  if (!serviceRoleKey) {
    if (process.stdin.isTTY) {
      console.log("\n⚠️  SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di environment maupun .env.");
      console.log("   Dapatkan key ini dari Supabase Dashboard -> Project Settings -> API -> Project API Keys (service_role secret).");
      serviceRoleKey = await askQuestion("Masukkan SUPABASE_SERVICE_ROLE_KEY: ");
    }
  }

  if (!serviceRoleKey) {
    console.error("\n❌ ERROR: SUPABASE_SERVICE_ROLE_KEY dibutuhkan untuk otorisasi administratif.");
    console.error("Key ini bersifat rahasia dan TIDAK BOLEH dipublikasikan ke client (tanpa prefix NEXT_PUBLIC_).");
    console.error("Silakan set env var SUPABASE_SERVICE_ROLE_KEY atau berikan melalui prompt.\n");
    process.exit(1);
  }

  // 3. Inisialisasi Supabase Admin Client
  console.log(`🔌 Menghubungkan ke Supabase: ${supabaseUrl}`);
  console.log(`🔑 Service Role Key        : ${maskSecret(serviceRoleKey)}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 4. Cari Akun pada Supabase Auth (auth.users)
  console.log(`\n🔍 Mencari akun dengan email '${normalizedEmail}' di Supabase Authentication...`);

  let authUsers = [];
  try {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      throw error;
    }
    authUsers = data?.users || [];
  } catch (err) {
    console.error("\n❌ Gagal mengakses Supabase Auth Admin API:", err.message || err);
    console.error("Pastikan SUPABASE_SERVICE_ROLE_KEY yang Anda masukkan valid dan memiliki hak akses service_role.");
    process.exit(1);
  }

  const matchedUsers = authUsers.filter(
    (u) => u.email && u.email.toLowerCase().trim() === normalizedEmail
  );

  // Validasi: Harus ditemukan TEPAT 1 KALI
  if (matchedUsers.length === 0) {
    console.error(`\n❌ ERROR: Akun dengan email '${normalizedEmail}' tidak ditemukan di Supabase Auth.`);
    console.error("Persyaratan bootstrap: Akun target HARUS sudah terdaftar terlebih dahulu.");
    console.error("Silakan lakukan registrasi akun terlebih dahulu di https://nemolearn.vercel.app/login atau via Google OAuth.\n");
    process.exit(1);
  }

  if (matchedUsers.length > 1) {
    console.error(`\n❌ ERROR: Ditemukan ${matchedUsers.length} akun dengan email yang sama.`);
    console.error("Operasi dibatalkan demi menjaga integritas data dan keamanan sistem.\n");
    process.exit(1);
  }

  const targetAuthUser = matchedUsers[0];

  // 5. Periksa status data di PostgreSQL (public.users)
  let pgUser = null;
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", targetAuthUser.id)
      .maybeSingle();

    if (!error && data) {
      pgUser = data;
    }
  } catch (err) {
    console.warn("⚠️  Catatan: Gagal memverifikasi data pengguna di tabel public.users:", err.message);
  }

  // 6. Tampilkan Rincian Akun Target
  const currentAuthRole = targetAuthUser.app_metadata?.role || "(belum ada)";
  const currentPgRole = pgUser?.role || "(belum ada)";
  const provider = targetAuthUser.app_metadata?.provider || "email";
  const displayName =
    targetAuthUser.user_metadata?.full_name ||
    targetAuthUser.user_metadata?.name ||
    pgUser?.display_name ||
    normalizedEmail.split("@")[0];

  console.log("\n--------------------------------------------------------------------------------");
  console.log("                       RINCIAN AKUN TARGET DITEMUKAN                             ");
  console.log("--------------------------------------------------------------------------------");
  console.log(`User ID (UUID)       : ${targetAuthUser.id}`);
  console.log(`Email                : ${targetAuthUser.email}`);
  console.log(`Nama Tampilan        : ${displayName}`);
  console.log(`Penyedia Auth        : ${provider}`);
  console.log(`Email Terverifikasi  : ${targetAuthUser.email_confirmed_at ? "Ya (Terverifikasi)" : "Belum"}`);
  console.log(`Tanggal Pendaftaran  : ${targetAuthUser.created_at || "-"}`);
  console.log(`Role Auth Saat Ini   : ${currentAuthRole}`);
  console.log(`Role DB Saat Ini     : ${currentPgRole}`);
  console.log(`Target Role Baru     : ${targetRole.toUpperCase()}`);
  console.log("--------------------------------------------------------------------------------\n");

  // Jika sudah memiliki role tersebut
  if (currentAuthRole === targetRole && currentPgRole === targetRole) {
    console.log(`ℹ️  Akun '${normalizedEmail}' SUDAH memiliki role '${targetRole}' di Supabase Auth dan Database.`);
    console.log("Tidak ada perubahan yang diperlukan.");
    process.exit(0);
  }

  // 7. Mode Dry-Run
  if (isDryRun) {
    console.log("🧪 [DRY RUN]: Mode simulasi aktif. Tidak ada perubahan yang disimpan ke sistem.");
    console.log("Rencana Perubahan:");
    console.log(`  - Supabase Auth app_metadata.role -> '${targetRole}' (preserve other metadata)`);
    console.log(`  - public.users role               -> '${targetRole}'`);
    console.log(`  - public.users permissions        -> ${targetRole === "owner" ? "ALL_ADMIN_PERMISSIONS" : "[]"}`);
    console.log(`  - public.system_logs              -> INSERT audit log record`);
    console.log("\nSimulasi selesai dengan sukses.\n");
    process.exit(0);
  }

  // 8. Konfirmasi Interaktif (Wajib konfirmasi sebelum perubahan)
  if (!autoConfirm) {
    console.log("⚠️  PERINGATAN KEAMANAN:");
    if (isRevert) {
      console.log(`   Anda akan menurunkan/mengubah role akun '${normalizedEmail}' menjadi '${targetRole}'.`);
    } else {
      console.log(`   Tindakan ini akan memberikan hak istimewa OWNER tertinggi kepada akun '${normalizedEmail}'.`);
      console.log("   Owner memiliki akses mutlak ke seluruh data, sistem AI, manajemen pengguna, dan pengaturan.");
    }
    console.log("");

    const answer = await askQuestion(`Ketik 'YA' untuk mengonfirmasi perubahan ini: `);
    if (answer !== "YA" && answer !== "ya") {
      console.log("\n⛔ Operasi dibatalkan oleh pengguna. Tidak ada perubahan yang diterapkan.\n");
      process.exit(0);
    }
  }

  // 9. Eksekusi Perubahan
  console.log("\n🚀 Menerapkan perubahan role...");

  const nowIso = new Date().toISOString();

  // A. Update Supabase Auth app_metadata (Server-side RBAC & RLS)
  try {
    const existingAppMeta = targetAuthUser.app_metadata || {};
    const updatedAppMeta = {
      ...existingAppMeta,
      role: targetRole,
    };

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
      targetAuthUser.id,
      {
        app_metadata: updatedAppMeta,
      }
    );

    if (authUpdateError) {
      throw new Error(`Supabase Auth Update Error: ${authUpdateError.message}`);
    }
    console.log("✓ Supabase Auth: app_metadata.role berhasil diperbarui menjadi '" + targetRole + "'.");
  } catch (err) {
    console.error("❌ Gagal memperbarui app_metadata di Supabase Auth:", err.message);
    process.exit(1);
  }

  // B. Update / Upsert tabel public.users di Supabase Postgres
  try {
    const permissions =
      targetRole === "owner"
        ? ALL_ADMIN_PERMISSION_IDS
        : targetRole === "admin"
        ? DEFAULT_ADMIN_PERMISSION_IDS
        : [];

    if (pgUser) {
      const { error: pgUpdateErr } = await supabase
        .from("users")
        .update({
          role: targetRole,
          permissions,
          status: "active",
          updated_at: nowIso,
        })
        .eq("id", targetAuthUser.id);

      if (pgUpdateErr) throw pgUpdateErr;
      console.log("✓ PostgreSQL public.users: Data user berhasil diperbarui ke role '" + targetRole + "'.");
    } else {
      const { error: pgInsertErr } = await supabase.from("users").insert({
        id: targetAuthUser.id,
        email: normalizedEmail,
        display_name: displayName,
        role: targetRole,
        status: "active",
        verification_status: "verified",
        permissions,
        auth_provider: provider === "google" ? "google" : "email",
        auth_provider_id: targetAuthUser.id,
        email_verified: Boolean(targetAuthUser.email_confirmed_at),
        created_at: targetAuthUser.created_at || nowIso,
        updated_at: nowIso,
        last_active_at: nowIso,
      });

      if (pgInsertErr) throw pgInsertErr;
      console.log("✓ PostgreSQL public.users: Record user baru berhasil disisipkan dengan role '" + targetRole + "'.");
    }
  } catch (err) {
    console.error("❌ Gagal memperbarui tabel public.users:", err.message);
    process.exit(1);
  }

  // C. Catat Log Audit Forensik di public.system_logs
  try {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const actionName = isRevert ? "ROLE_REVERT_BOOTSTRAP" : "BOOTSTRAP_OWNER_PROMOTION";

    await supabase.from("system_logs").insert({
      id: logId,
      level: "warning",
      action: actionName,
      actor_id: "bootstrap_cli",
      actor_email: "cli@nemolearn.local",
      actor_name: "Bootstrap CLI Script",
      actor_role: "system",
      target_type: "user",
      target_id: targetAuthUser.id,
      ip_address: "127.0.0.1",
      user_agent: "NemoLearn-Bootstrap-CLI/1.0",
      details: `Role akun '${normalizedEmail}' ditetapkan menjadi '${targetRole}' via bootstrap script administratif.`,
      status: "success",
      category: "security",
      payload: {
        target_user_id: targetAuthUser.id,
        target_email: normalizedEmail,
        previous_auth_role: currentAuthRole,
        previous_pg_role: currentPgRole,
        new_role: targetRole,
        timestamp: nowIso,
      },
      created_at: nowIso,
    });
    console.log("✓ Audit Log: Jejak forensik berhasil dicatat di public.system_logs.");
  } catch (logErr) {
    console.warn("⚠️  Peringatan: Gagal mencatat system log (non-fatal):", logErr.message);
  }

  // 10. Laporan Keberhasilan & Panduan Langkah Pengguna
  console.log("\n================================================================================");
  console.log(`🎉 BERHASIL: Akun ${normalizedEmail} kini resmi memiliki role '${targetRole.toUpperCase()}'!`);
  console.log("================================================================================\n");
  console.log("Rangkuman Hasil:");
  console.log(`- Email Akun        : ${normalizedEmail}`);
  console.log(`- User ID (UUID)    : ${targetAuthUser.id}`);
  console.log(`- Role Terpasang    : ${targetRole}`);
  console.log(`- Supabase Auth     : app_metadata.role = '${targetRole}'`);
  console.log(`- Supabase Postgres : public.users.role = '${targetRole}'`);
  console.log(`- Status Akun       : active (verified)`);
  console.log("\n📋 LANGKAH SELANJUTNYA UNTUK PENGGUNA:");
  console.log("1. Logout dari NemoLearn jika Anda saat ini sedang dalam keadaan login di browser.");
  console.log("   (Cookie sesi lama masih menyimpan role sebelumnya).");
  console.log("2. Buka https://nemolearn.vercel.app/login (atau localhost saat development).");
  console.log("3. Login kembali menggunakan akun Anda (Google OAuth atau Email/Password).");
  console.log("4. Sistem autentikasi NemoLearn akan otomatis menerbitkan cookie sesi baru");
  console.log("   dengan otorisasi penuh sebagai Owner.");
  console.log("5. Buka dashboard di https://nemolearn.vercel.app/admin untuk mengelola platform!\n");
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Terjadi error yang tidak tertangani:", err);
  process.exit(1);
});
