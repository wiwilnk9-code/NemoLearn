#!/usr/bin/env node
/**
 * ==============================================================================
 * NEMOLEARN — ROLE CONSISTENCY & AUTHORIZATION DIAGNOSTIC TOOL
 * ==============================================================================
 * Script diagnostik untuk mengaudit, memverifikasi, dan memperbaiki (self-heal)
 * konsistensi role akun di Supabase Auth (app_metadata), Supabase PostgreSQL
 * (public.users), dan sesi otorisasi server-side.
 *
 * Penggunaan:
 *   node scripts/diagnostic-role.js
 *   npm run diagnostic:role
 *   npm run diagnostic:role -- --email=wildannk9@gmail.com
 *   npm run diagnostic:role -- --email=wildannk9@gmail.com --heal
 * ==============================================================================
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { createClient } = require("@supabase/supabase-js");

const ALL_ADMIN_PERMISSION_IDS = [
  "manage_users",
  "manage_questions",
  "manage_sessions",
  "view_analytics",
  "manage_ai",
  "manage_settings",
  "view_audit_logs",
];

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

function loadConfig(args) {
  const rootDir = path.resolve(__dirname, "..");
  const envLocal = parseEnvFile(path.join(rootDir, ".env.local"));
  const envStandard = parseEnvFile(path.join(rootDir, ".env"));
  const getEnv = (key) => process.env[key] || envLocal[key] || envStandard[key] || "";

  let email = getEnv("OWNER_EMAIL");
  let serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  let supabaseUrl =
    getEnv("SUPABASE_URL") ||
    getEnv("NEXT_PUBLIC_SUPABASE_URL") ||
    "https://epbepzjheexkeqivcoql.supabase.co";
  let shouldHeal = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("--email=")) {
      email = arg.split("=")[1].trim();
    } else if (arg === "--email" && args[i + 1]) {
      email = args[++i].trim();
    } else if (arg.startsWith("--key=")) {
      serviceRoleKey = arg.split("=")[1].trim();
    } else if (arg === "--key" && args[i + 1]) {
      serviceRoleKey = args[++i].trim();
    } else if (arg === "--heal" || arg === "--fix") {
      shouldHeal = true;
    }
  }

  return { email, serviceRoleKey, supabaseUrl, shouldHeal };
}

function printHelp() {
  console.log(`
NemoLearn Role Consistency & Diagnostic Tool
=============================================
Periksa dan verifikasi keselarasan role akun pada seluruh sumber:
- Supabase Auth (app_metadata.role)
- PostgreSQL (public.users.role & permissions)
- Residu client user_metadata

PENGGUNAAN:
  node scripts/diagnostic-role.js [opsi]
  npm run diagnostic:role [opsi]

OPSI:
  --email=<email>         Email akun yang ingin diaudit (default: OWNER_EMAIL)
  --key=<key>             Supabase Service Role Key
  --url=<url>             Supabase Project URL
  --heal, --fix           Otomatis perbaiki jika terdeteksi konflik role
  --help, -h              Tampilkan panduan ini

CONTOH:
  # Mode interaktif
  npm run diagnostic:role

  # Periksa akun tertentu
  npm run diagnostic:role -- --email="wildannk9@gmail.com"

  # Periksa dan perbaiki otomatis (self-heal)
  npm run diagnostic:role -- --email="wildannk9@gmail.com" --heal
`);
}

function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans ? ans.trim() : "");
    });
  });
}

function maskSecret(str) {
  if (!str) return "(tidak ada)";
  if (str.length <= 8) return "********";
  return `${str.substring(0, 4)}...${str.substring(str.length - 4)}`;
}

async function main() {
  console.log("\n================================================================================");
  console.log("            NEMOLEARN — ROLE CONSISTENCY & AUTHORIZATION DIAGNOSTIC             ");
  console.log("================================================================================\n");

  const config = loadConfig(process.argv.slice(2));
  let { email, serviceRoleKey, supabaseUrl, shouldHeal } = config;

  if (!email && process.stdin.isTTY) {
    email = await askQuestion("Masukkan email akun yang ingin diperiksa (default: OWNER_EMAIL): ");
  }

  if (!email) {
    console.error("❌ ERROR: Email akun target wajib ditentukan!");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (!serviceRoleKey && process.stdin.isTTY) {
    serviceRoleKey = await askQuestion("Masukkan SUPABASE_SERVICE_ROLE_KEY: ");
  }

  if (!serviceRoleKey) {
    console.error("❌ ERROR: SUPABASE_SERVICE_ROLE_KEY wajib disediakan.");
    process.exit(1);
  }

  console.log(`🔌 Target Supabase  : ${supabaseUrl}`);
  console.log(`🔑 Service Role Key : ${maskSecret(serviceRoleKey)}`);
  console.log(`📧 Target Akun      : ${normalizedEmail}\n`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Ambil data dari auth.users via Admin API
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authErr) {
    console.error("❌ Gagal membaca Supabase Auth:", authErr.message);
    process.exit(1);
  }

  const authUser = authData.users.find((u) => u.email && u.email.toLowerCase().trim() === normalizedEmail);

  if (!authUser) {
    console.error(`❌ Akun '${normalizedEmail}' tidak ditemukan di Supabase Authentication.`);
    process.exit(1);
  }

  // 2. Ambil data dari public.users (PostgreSQL)
  const { data: pgUser, error: pgErr } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  // 3. Evaluasi Parameter Role
  const authAppRole = authUser.app_metadata?.role || "(tidak ada)";
  const authUserMetaRole = authUser.user_metadata?.role || "(tidak ada)";
  const pgRole = pgUser?.role || "(tidak ada)";
  const permissions = pgUser?.permissions || [];

  console.log("--------------------------------------------------------------------------------");
  console.log("                       HASIL DIAGNOSTIK KONSISTENSI ROLE                         ");
  console.log("--------------------------------------------------------------------------------");
  console.log(`User ID (UUID)               : ${authUser.id}`);
  console.log(`Email                        : ${authUser.email}`);
  console.log(`Nama Tampilan                : ${pgUser?.display_name || authUser.user_metadata?.name || "-"}`);
  console.log(`Auth Provider                : ${authUser.app_metadata?.provider || "email"}`);
  console.log(`Status Akun                  : ${pgUser?.status || "active"}`);
  console.log("");
  console.log(`[Sumber 1] Supabase Auth app_metadata.role : ${authAppRole.toUpperCase()}`);
  console.log(`[Sumber 2] PostgreSQL public.users.role   : ${pgRole.toUpperCase()}`);
  console.log(`[Sumber 3] Client user_metadata.role      : ${authUserMetaRole.toUpperCase()} (Wajib diabaikan)`);
  console.log(`Hak Izin (Permissions Count)              : ${permissions.length} item`);
  console.log("--------------------------------------------------------------------------------\n");

  const isRoleConsistent = authAppRole === pgRole;
  const isOwner = authAppRole === "owner" && pgRole === "owner";

  if (isRoleConsistent && isOwner) {
    console.log("✅ STATUS: KONSISTEN & SEHAT (HEALTHY)");
    console.log("Akun telah terverifikasi sebagai OWNER di Supabase Auth dan PostgreSQL.");
    console.log("Semua otorisasi server-side akan mengenali akun ini sebagai Owner.\n");
  } else {
    console.log("⚠️  STATUS: TERDETEKSI INKONSISTENSI (CONFLICT / MISMATCH)");
    if (authAppRole !== pgRole) {
      console.log(`- Terjadi ketidaksinkronan antara Auth app_metadata ('${authAppRole}') dan PostgreSQL ('${pgRole}').`);
    }
    if (authUserMetaRole !== "(tidak ada)") {
      console.log(`- Terdeteksi residu 'role' pada user_metadata ('${authUserMetaRole}'). Ini berpotensi membingungkan klien.`);
    }

    if (!shouldHeal && process.stdin.isTTY) {
      const healConfirm = await askQuestion("\nApakah Anda ingin memperbaiki inkonsistensi ini sekarang (Self-Heal ke OWNER)? (Ketik 'YA'): ");
      if (healConfirm === "YA" || healConfirm === "ya") {
        shouldHeal = true;
      }
    }

    if (shouldHeal) {
      console.log("\n🔧 Menjalankan perbaikan otomatis (Self-Healing)...");

      // A. Update Auth app_metadata
      const updatedAppMeta = { ...authUser.app_metadata, role: "owner" };
      await supabase.auth.admin.updateUserById(authUser.id, { app_metadata: updatedAppMeta });
      console.log("✓ Supabase Auth: app_metadata.role diset ke 'owner'");

      // B. Bersihkan residu role dari user_metadata jika ada
      if (authUser.user_metadata && authUser.user_metadata.role) {
        const cleanedUserMeta = { ...authUser.user_metadata };
        delete cleanedUserMeta.role;
        await supabase.auth.admin.updateUserById(authUser.id, { user_metadata: cleanedUserMeta });
        console.log("✓ Supabase Auth: residu role pada user_metadata dibersihkan");
      }

      // C. Update public.users di PostgreSQL
      await supabase.from("users").upsert({
        id: authUser.id,
        email: normalizedEmail,
        display_name: pgUser?.display_name || authUser.user_metadata?.name || normalizedEmail.split("@")[0],
        role: "owner",
        permissions: ALL_ADMIN_PERMISSION_IDS,
        status: "active",
        email_verified: Boolean(authUser.email_confirmed_at),
        updated_at: new Date().toISOString(),
      });
      console.log("✓ PostgreSQL: public.users.role diset ke 'owner' dengan seluruh izin administratif");

      console.log("\n🎉 Perbaikan selesai! Seluruh sumber role kini sinkron sebagai OWNER.");
    } else {
      console.log("\nJalankan kembali dengan opsi --heal untuk menerapkan perbaikan otomatis.");
    }
  }

  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Terjadi error tak terduga:", err);
  process.exit(1);
});
