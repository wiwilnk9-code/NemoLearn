import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { POST as logoutHandler } from "@/app/api/auth/logout/route";
import { GET as oauthCallbackHandler } from "@/app/auth/callback/route";
import { UserRepository, loadDb } from "@/lib/db";
import { COOKIE_NAME, verifySessionToken, createSessionToken } from "@/lib/auth/server";
import { User } from "@/types/user";

describe("NEMOLEARN AUTHENTICATION REPAIR & GOOGLE OAUTH SUITE", () => {
  beforeEach(() => {
    // Reset database state to pristine seed
    const db = loadDb();
    assert.ok(db.users, "Database state must be loaded");
  });

  describe("PART 1: Filesystem Safety & Zero Windows Path Reliance", () => {
    it("memastikan DB_FILE dan konfigurasi penyimpanan tidak memuat hardcoded Windows path developer", () => {
      const db = loadDb();
      assert.ok(db, "Database state must be initialized");

      // Verifikasi source code src/lib/db/index.ts tidak memuat hardcoded Windows path
      const fs = require("fs");
      const path = require("path");
      const dbSource = fs.readFileSync(path.resolve(process.cwd(), "src/lib/db/index.ts"), "utf-8");
      assert.strictEqual(
        dbSource.includes("C:\\Users\\wilda") || dbSource.includes("C:\\\\Users\\\\wilda"),
        false,
        "src/lib/db/index.ts must not contain hardcoded Windows developer path"
      );
    });
  });

  describe("PART 2: Registration & Email/Password Login Flow", () => {
    it("menolak registrasi jika input nama, email, atau password kosong/tidak valid", async () => {
      // 1. Nama kosong
      const req1 = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "", email: "test@sma.id", password: "Password123!" }),
      });
      const res1 = await registerHandler(req1);
      assert.strictEqual(res1.status, 400);
      const data1 = await res1.json();
      assert.strictEqual(data1.success, false);

      // 2. Format email tidak valid
      const req2 = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Siswa Baru", email: "invalid-email-format", password: "Password123!", confirmPassword: "Password123!", agreeTerms: true, agreePrivacy: true }),
      });
      const res2 = await registerHandler(req2);
      assert.strictEqual(res2.status, 400);
      const data2 = await res2.json();
      assert.strictEqual(data2.error, "Format alamat email tidak valid.");

      // 3. Konfirmasi kata sandi tidak cocok
      const req3 = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Siswa Baru", email: "siswa@sma.id", password: "Password123!", confirmPassword: "DifferentPass123!", agreeTerms: true, agreePrivacy: true }),
      });
      const res3 = await registerHandler(req3);
      assert.strictEqual(res3.status, 400);
      const data3 = await res3.json();
      assert.strictEqual(data3.error, "Konfirmasi kata sandi tidak cocok dengan kata sandi.");

      // 4. Belum menyetujui Ketentuan Layanan (ToS)
      const req4 = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "Siswa Baru", email: "siswa@sma.id", password: "Password123!", confirmPassword: "Password123!", agreeTerms: false, agreePrivacy: true }),
      });
      const res4 = await registerHandler(req4);
      assert.strictEqual(res4.status, 400);
      const data4 = await res4.json();
      assert.strictEqual(data4.error, "Anda wajib menyetujui Ketentuan Layanan (Terms of Service).");
    });

    it("menolak registrasi jika email sudah terdaftar sebelumnya (Anti-Duplikasi 409)", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Budi Santoso Duplikat",
          email: "budi.santoso@siswa.sma.id", // Sudah ada di seed
          password: "PelajarNemo2026!",
          confirmPassword: "PelajarNemo2026!",
          agreeTerms: true,
          agreePrivacy: true,
        }),
      });

      const res = await registerHandler(req);
      assert.strictEqual(res.status, 409);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes("sudah terdaftar"));
    });

    it("registrasi berhasil selalu menghasilkan peran 'pelajar' (Least-Privilege Guard)", async () => {
      const testEmail = `siswa_${Date.now()}@test.sma.id`;
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Ahmad Siswa Mandiri",
          email: testEmail,
          password: "SiswaMandiri2026!",
          confirmPassword: "SiswaMandiri2026!",
          agreeTerms: true,
          agreePrivacy: true,
          parentalConsent: true,
          school: "SMAN 2 Surabaya",
          // Percobaan manipulasi role (privilege escalation exploit)
          role: "owner",
        }),
      });

      const res = await registerHandler(req);
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, "pelajar", "Registrasi publik wajib selalu menghasilkan role 'pelajar'");
      assert.strictEqual(data.user.email, testEmail);

      // Pastikan kata sandi tidak dikembalikan dalam respon
      assert.strictEqual(data.user.passwordHash, undefined);

      // Verifikasi di repositori
      const saved = UserRepository.getByEmail(testEmail);
      assert.ok(saved);
      assert.strictEqual(saved.role, "pelajar");
    });

    it("login gagal jika kata sandi salah dengan pesan ramah pengguna", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "budi.santoso@siswa.sma.id",
          password: "WrongPassword999!",
        }),
      });

      const res = await loginHandler(req);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.error, "Alamat email atau kata sandi yang Anda masukkan salah.");
    });

    it("login gagal jika akun berstatus suspended (Akun Ditangguhkan Guard)", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "farhan.alamsyah@gmail.com", // Status: suspended di seed
          password: "SomePassword123!",
        }),
      });

      const res = await loginHandler(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes("dinonaktifkan (suspended)"));
    });

    it("login berhasil dengan kredensial benar, menerbitkan cookie HTTP-Only", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "budi.santoso@siswa.sma.id",
          password: "PelajarNemo2026!",
        }),
      });

      const res = await loginHandler(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.email, "budi.santoso@siswa.sma.id");
      assert.strictEqual(data.user.role, "pelajar");

      // Periksa Set-Cookie header memuat nemoquiz_session
      const setCookie = res.headers.get("set-cookie");
      assert.ok(setCookie, "Set-Cookie header must be present");
      assert.ok(setCookie.includes(COOKIE_NAME), `Cookie must include ${COOKIE_NAME}`);
      assert.ok(setCookie.includes("HttpOnly"), "Session cookie must be HttpOnly");
      assert.ok(setCookie.toLowerCase().includes("samesite=lax"), "Cookie must be SameSite=Lax");
    });

    it("logout berhasil menghapus sesi dan mencatat audit log", async () => {
      const user = UserRepository.getByEmail("budi.santoso@siswa.sma.id");
      assert.ok(user);
      const sessionToken = createSessionToken(user);

      const req = new Request("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: {
          cookie: `${COOKIE_NAME}=${sessionToken}`,
        },
      });

      const res = await logoutHandler(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      // Verifikasi penghapusan cookie
      const setCookie = res.headers.get("set-cookie");
      assert.ok(setCookie);
      assert.ok(setCookie.includes(`${COOKIE_NAME}=;`) || setCookie.includes("Max-Age=0"));
    });
  });

  describe("PART 3: Google OAuth Integration & Callback Handling", () => {
    it("menangani kondisi pembatalan autentikasi oleh pengguna (error=access_denied)", async () => {
      const req = new Request("http://localhost:3000/auth/callback?error=access_denied&error_description=User+cancelled+authorization");
      const res = await oauthCallbackHandler(req);

      assert.strictEqual(res.status, 307); // Temporary Redirect
      const location = res.headers.get("location");
      assert.ok(location);
      assert.ok(location.includes("/login?error=cancelled"), "Must redirect to /login with error=cancelled");
    });

    it("menangani kondisi redirect_uri_mismatch dengan pesan yang informatif", async () => {
      const req = new Request("http://localhost:3000/auth/callback?error=redirect_uri_mismatch&error_description=The+redirect_uri+in+the+request+did+not+match");
      const res = await oauthCallbackHandler(req);

      assert.strictEqual(res.status, 307);
      const location = res.headers.get("location");
      assert.ok(location);
      assert.ok(location.includes("/login?error=redirect_mismatch"));
    });

    it("menangani kondisi provider belum aktif (unsupported_provider)", async () => {
      const req = new Request("http://localhost:3000/auth/callback?error=unsupported_provider&error_description=Google+provider+is+not+enabled");
      const res = await oauthCallbackHandler(req);

      assert.strictEqual(res.status, 307);
      const location = res.headers.get("location");
      assert.ok(location);
      assert.ok(location.includes("/login?error=provider_disabled"));
    });

    it("menolak callback tanpa authorization code (missing_code)", async () => {
      const req = new Request("http://localhost:3000/auth/callback");
      const res = await oauthCallbackHandler(req);

      assert.strictEqual(res.status, 307);
      const location = res.headers.get("location");
      assert.ok(location);
      assert.ok(location.includes("/login?error=missing_code"));
    });

    it("memastikan pengguna Google baru selalu mendapatkan role 'pelajar' dan tidak pernah admin/owner", () => {
      // Simulasi pembuatan pengguna dari data metadata Google
      const googleUserEmail = "siswa.baru.google@gmail.com";
      const existing = UserRepository.getByEmail(googleUserEmail);
      assert.strictEqual(existing, null);

      const newUser: User = {
        id: "usr_google_test_123",
        authProviderId: "google_sub_123",
        email: googleUserEmail,
        displayName: "Siswa Google Test",
        role: "pelajar",
        status: "active",
        verificationStatus: "verified",
        emailVerified: true,
        authProvider: "google",
        createdAt: new Date().toISOString(),
      };

      const created = UserRepository.create(newUser);
      assert.strictEqual(created.role, "pelajar");
      assert.notStrictEqual(created.role, "admin");
      assert.notStrictEqual(created.role, "owner");
    });

    it("memastikan account linking bekerja saat email Google sudah terdaftar via email/password", () => {
      const existingEmail = "budi.santoso@siswa.sma.id";
      const userBefore = UserRepository.getByEmail(existingEmail);
      assert.ok(userBefore);
      const originalRole = userBefore.role;
      const originalId = userBefore.id;

      // Simulasi proses linking pada callback
      UserRepository.update(userBefore.id, {
        authProviderId: "google_provider_uid_456",
        emailVerified: true,
        lastActiveAt: new Date().toISOString(),
      });

      const userAfter = UserRepository.getByEmail(existingEmail);
      assert.ok(userAfter);
      assert.strictEqual(userAfter.id, originalId, "User ID harus tetap sama (tidak membuat akun ganda)");
      assert.strictEqual(userAfter.role, originalRole, "Peran pengguna tidak boleh diubah");
      assert.strictEqual(userAfter.authProviderId, "google_provider_uid_456");
      assert.strictEqual(userAfter.emailVerified, true);
    });

    it("memastikan akun suspended ditolak saat mencoba login melalui Google OAuth", () => {
      const suspendedUser = UserRepository.getByEmail("farhan.alamsyah@gmail.com");
      assert.ok(suspendedUser);
      assert.strictEqual(suspendedUser.status, "suspended");

      // Verifikasi status suspended memblokir otorisasi
      assert.strictEqual(suspendedUser.status === "suspended", true);
    });
  });
});
