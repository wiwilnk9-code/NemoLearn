import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { GET as verifyEmailGet, POST as verifyEmailPost } from "@/app/api/auth/verify-email/route";
import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";
import { GET as meGet } from "@/app/api/auth/me/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as profilePost } from "@/app/api/profile/route";
import { GET as adminUsersGet } from "@/app/api/admin/users/route";
import { UserRepository } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "@/lib/auth/password";
import {
  createSessionToken,
  verifySessionToken,
  requireAuth,
  requireVerifiedEmail,
  COOKIE_NAME,
} from "@/lib/auth/server";
import { User } from "@/types/user";

describe("NEMOLEARN TASK 2 — PRODUCTION AUTHENTICATION & IAM SUITE", () => {
  // 1. Password Hashing & Strength
  describe("1. Password Cryptography & Security Guards", () => {
    it("menghasilkan hash password ber-salt unik untuk password yang sama", () => {
      const pass = "RahasiaSiswa2026!";
      const hash1 = hashPassword(pass);
      const hash2 = hashPassword(pass);

      assert.notStrictEqual(hash1, hash2, "Salt harus berbeda untuk setiap hash yang dihasilkan");
      assert.strictEqual(verifyPassword(pass, hash1), true);
      assert.strictEqual(verifyPassword(pass, hash2), true);
      assert.strictEqual(verifyPassword("WrongPassword!", hash1), false);
    });

    it("memvalidasi kriteria kekuatan kata sandi (min 8 karakter, huruf, dan angka)", () => {
      assert.strictEqual(validatePasswordStrength("pendek").isValid, false);
      assert.strictEqual(validatePasswordStrength("hanyahurufaja").isValid, false);
      assert.strictEqual(validatePasswordStrength("12345678").isValid, false);
      assert.strictEqual(validatePasswordStrength("ValidPass123").isValid, true);
    });
  });

  // 2. User Registration & Privilege Escalation Prevention
  describe("2. Self-Registration & Privilege Escalation Guards", () => {
    const testEmail = `siswa.test.${Date.now()}@sma.sch.id`;

    it("berhasil mendaftarkan akun baru dengan data valid dan role 'pelajar'", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Rangga Pratama",
          email: testEmail,
          password: "Password123!",
          confirmPassword: "Password123!",
          school: "SMAN 2 Surabaya",
          agreeTerms: true,
          agreePrivacy: true,
        }),
      });

      const res = await registerPost(req);
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, "pelajar");
      assert.strictEqual(data.user.emailVerified, false);
      assert.strictEqual(data.user.email, testEmail);
      assert.ok(data.verificationToken, "Harus mengembalikan token verifikasi");
    });

    it("mencegah privilege escalation: user mencoba mendaftar sebagai 'admin' atau 'owner'", async () => {
      const hackerEmail = `hacker.${Date.now()}@hack.com`;
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Mr. Hacker",
          email: hackerEmail,
          password: "HackerPass123!",
          confirmPassword: "HackerPass123!",
          role: "owner", // Upaya eskalasi peran
          agreeTerms: true,
          agreePrivacy: true,
        }),
      });

      const res = await registerPost(req);
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(
        data.user.role,
        "pelajar",
        "Role registrasi publik WAJIB dipaksa menjadi 'pelajar' di backend"
      );
    });

    it("menolak registrasi jika syarat ToS atau Privacy Policy tidak disetujui", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "User No Terms",
          email: `noterms.${Date.now()}@sma.id`,
          password: "Password123!",
          confirmPassword: "Password123!",
          agreeTerms: false, // Tidak setuju
          agreePrivacy: true,
        }),
      });

      const res = await registerPost(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.error.includes("Ketentuan Layanan"));
    });

    it("menolak registrasi email ganda (duplikat)", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Duplicate Student",
          email: testEmail, // Email yang sudah terdaftar di atas
          password: "Password123!",
          confirmPassword: "Password123!",
          agreeTerms: true,
          agreePrivacy: true,
        }),
      });

      const res = await registerPost(req);
      assert.strictEqual(res.status, 409);
    });
  });

  // 3. Email Verification Flow
  describe("3. Email Verification Flow & Unverified Gate", () => {
    it("menolak token verifikasi palsu / invalid", async () => {
      const req = new Request("http://localhost:3000/api/auth/verify-email?token=invalid_token_xyz");
      const res = await verifyEmailGet(req);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it("berhasil memverifikasi email dengan token sah dan mengaktifkan status verifikasi", async () => {
      const uniqueToken = `tok_verif_unique_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const testUser: User = {
        id: `usr_unverif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: `unverified.${Date.now()}.${Math.random().toString(36).substring(2, 6)}@siswa.id`,
        displayName: "Siswa Unverified Test",
        role: "pelajar",
        status: "active",
        createdAt: new Date().toISOString(),
        emailVerified: false,
        verificationToken: uniqueToken,
        verificationTokenExpires: new Date(Date.now() + 3600000).toISOString(),
      };
      UserRepository.create(testUser);

      const req = new Request(`http://localhost:3000/api/auth/verify-email?token=${uniqueToken}`);
      const res = await verifyEmailGet(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      // Verifikasi di DB
      const updated = UserRepository.getById(testUser.id);
      assert.strictEqual(updated?.emailVerified, true);
      assert.strictEqual(updated?.verificationToken, undefined);
    });

    it("requireVerifiedEmail menolak akun yang belum memverifikasi email", async () => {
      const unverifiedUser: User = {
        id: `usr_unverif_gate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: `gate.${Date.now()}@siswa.id`,
        displayName: "Siswa Gate Check",
        role: "pelajar",
        status: "active",
        createdAt: new Date().toISOString(),
        emailVerified: false,
      };
      UserRepository.create(unverifiedUser);

      const sessionToken = createSessionToken(unverifiedUser);
      await assert.rejects(
        async () => {
          await requireVerifiedEmail(undefined, undefined, sessionToken);
        },
        (err: any) => {
          return err.message.includes("EMAIL_UNVERIFIED");
        }
      );
    });
  });

  // 4. Login, Session Management, and Expiration
  describe("4. Login, Session Management & Cookie Integrity", () => {
    it("berhasil login dengan email dan kata sandi yang valid", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "owner@nemoquiz.edu",
          password: "OwnerNemo2026!",
        }),
      });

      const res = await loginPost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, "owner");
      assert.strictEqual(data.user.passwordHash, undefined, "Password hash tidak boleh bocor");

      // Verifikasi Cookie Set-Cookie header
      const cookieHeader = res.headers.get("set-cookie");
      assert.ok(cookieHeader && cookieHeader.includes(COOKIE_NAME));
      assert.ok(cookieHeader.includes("HttpOnly"));
    });

    it("menolak login jika kata sandi salah (401)", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "owner@nemoquiz.edu",
          password: "WrongPassword999!",
        }),
      });

      const res = await loginPost(req);
      assert.strictEqual(res.status, 401);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    it("menolak login jika akun dalam status suspended (403)", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "farhan.alamsyah@gmail.com", // Akun suspended
          password: "Password123!",
        }),
      });

      const res = await loginPost(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes("suspended"));
    });

    it("menolak token sesi yang telah kedaluwarsa (session expired)", () => {
      const expiredPayload = {
        userId: "usr_pelajar_01",
        role: "pelajar" as const,
        email: "budi.santoso@siswa.sma.id",
        expiresAt: Date.now() - 1000, // Kedaluwarsa 1 detik lalu
      };
      const secret = process.env.AUTH_SECRET || "default-dev-secret-key-32-chars-long";
      const crypto = require("crypto");
      const data = Buffer.from(JSON.stringify(expiredPayload)).toString("base64");
      const sig = crypto.createHmac("sha256", secret).update(data).digest("hex");
      const expiredToken = `${data}.${sig}`;

      const verified = verifySessionToken(expiredToken);
      assert.strictEqual(verified, null, "Token kedaluwarsa wajib ditolak");
    });
  });

  // 5. Password Recovery (Forgot & Reset Password)
  describe("5. Password Recovery & Anti-Enumeration", () => {
    const studentUser = UserRepository.getById("usr_pelajar_01")!;

    it("menerbitkan reset token saat forgot-password diminta", async () => {
      const req = new Request("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: studentUser.email,
        }),
      });

      const res = await forgotPasswordPost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.resetToken, "Token reset harus diterbitkan");

      // Periksa bahwa token tersimpan di user
      const updated = UserRepository.getById(studentUser.id);
      assert.strictEqual(updated?.resetPasswordToken, data.resetToken);

      // Reset password dengan token tersebut
      const resetReq = new Request("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.resetToken,
          password: "NewPassword2026!",
          confirmPassword: "NewPassword2026!",
        }),
      });

      const resetRes = await resetPasswordPost(resetReq);
      assert.strictEqual(resetRes.status, 200);
      const resetData = await resetRes.json();
      assert.strictEqual(resetData.success, true);

      // Verifikasi bahwa user kini bisa login dengan password baru
      const newLoginReq = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: studentUser.email,
          password: "NewPassword2026!",
        }),
      });
      const newLoginRes = await loginPost(newLoginReq);
      assert.strictEqual(newLoginRes.status, 200);

      // Token reset harus sudah dibersihkan setelah dipakai
      const userAfter = UserRepository.getById(studentUser.id);
      assert.strictEqual(userAfter?.resetPasswordToken, undefined);
    });

    it("anti-enumeration: forgot-password tetap merespon sukses jika email tidak ditemukan", async () => {
      const req = new Request("http://localhost:3000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "tidak_terdaftar_random_999@domain.com",
        }),
      });

      const res = await forgotPasswordPost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.resetToken, undefined, "Email tidak terdaftar tidak boleh menghasilkan token");
    });
  });

  // 6. Administrative Protection & Least Privilege
  describe("6. Administrative Access Control & RBAC Enforcement", () => {
    it("menolak akses endpoint admin bagi request tanpa sesi (401)", async () => {
      const req = new Request("http://localhost:3000/api/admin/users");
      const res = await adminUsersGet(req);
      assert.strictEqual(res.status, 401);
    });

    it("menolak akses endpoint admin bagi akun Pelajar (403)", async () => {
      const student = UserRepository.getById("usr_pelajar_01")!;
      const studentToken = createSessionToken(student);

      const req = new Request("http://localhost:3000/api/admin/users", {
        headers: {
          cookie: `${COOKIE_NAME}=${studentToken}`,
        },
      });

      const res = await adminUsersGet(req);
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.ok(data.error.includes("FORBIDDEN"));
    });

    it("mengizinkan akses endpoint admin bagi akun Administrator/Owner resmi (200)", async () => {
      const owner = UserRepository.getById("usr_owner_01")!;
      const ownerToken = createSessionToken(owner);

      const req = new Request("http://localhost:3000/api/admin/users", {
        headers: {
          cookie: `${COOKIE_NAME}=${ownerToken}`,
        },
      });

      const res = await adminUsersGet(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.users));
    });

    it("mencegah modifikasi role melalui API pembaruan profil pengguna", async () => {
      const student = UserRepository.getById("usr_pelajar_02")!;
      const studentToken = createSessionToken(student);

      const req = new Request("http://localhost:3000/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${COOKIE_NAME}=${studentToken}`,
        },
        body: JSON.stringify({
          displayName: "Nadia Safitri Updated",
          role: "owner", // Upaya pembobolan role via profile update
        }),
      });

      const res = await profilePost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.user.role, "pelajar", "Role tidak boleh berubah lewat API profile");
      assert.strictEqual(data.user.displayName, "Nadia Safitri Updated");
    });
  });

  // 7. Logout & Audit Logging
  describe("7. Logout & Audit Trail Verification", () => {
    it("membersihkan cookie sesi saat logout dan menambahkan marker logout", async () => {
      const owner = UserRepository.getById("usr_owner_01")!;
      const ownerToken = createSessionToken(owner);

      const req = new Request("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: {
          cookie: `${COOKIE_NAME}=${ownerToken}`,
        },
      });

      const res = await logoutPost(req);
      assert.strictEqual(res.status, 200);
      const cookieHeader = res.headers.get("set-cookie");
      assert.ok(cookieHeader && cookieHeader.includes("nemo_logged_out=1"));
    });
  });
});
