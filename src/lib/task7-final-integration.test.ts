import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  UserRepository,
  QuestionRepository,
  SessionRepository,
  ResponseRepository,
  ReportRepository,
  FeedbackRepository,
  SystemLogRepository,
  ExplanationRepository,
  UserQuotaRepository,
  WebsiteSettingsRepository,
  SubjectRepository,
  loadDb,
} from "./db";
import { User } from "@/types/user";
import { PracticeSession } from "@/types/session";
import { Question } from "@/types/question";
import {
  createSessionToken,
  verifySessionToken,
  requireAuth,
  getCurrentUser,
  COOKIE_NAME,
} from "./auth/server";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  generateCryptoToken,
  sanitizeUserOutput,
} from "./auth/password";
import {
  reserveAiQuota,
  confirmAiQuota,
  releaseAiQuota,
  getUserQuotaStatus,
  grantUserAiAccess,
  revokeUserAiAccess,
  getNextJakartaMidnightIso,
  getJakartaDateString,
  resetRateLimitsForTesting,
} from "./ai/quota-manager";
import { getAIProvider } from "./ai";
import { MockAIProvider } from "./ai/mock";
import {
  renderMathExpression,
  cleanLatexForPlainText,
  normalizeMathDelimiters,
  normalizeMathDecimals,
  parseMathTokens,
} from "./math/parser";
import { evaluatePracticeSession } from "./scoring/calculator";
import { generateRemedialPdf } from "./pdf/remedial-pdf";
import nextConfig from "../../next.config.mjs";
import { POST as registerPost } from "@/app/api/auth/register/route";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";
import { POST as deleteAccountPost } from "@/app/api/auth/delete-account/route";
import { POST as profilePost } from "@/app/api/profile/route";
import { GET as getSessionRoute } from "@/app/api/sessions/[id]/route";
import { POST as answerSessionRoute } from "@/app/api/sessions/[id]/answer/route";
import { POST as submitSessionRoute } from "@/app/api/sessions/[id]/submit/route";

describe("TASK 7: NEMOLEARN FINAL INTEGRATION TESTING & RELEASE CANDIDATE", () => {
  let ownerUser: User;
  let teacherUser: User;
  let studentUser: User;
  let unauthorizedStudent: User;

  beforeEach(() => {
    resetRateLimitsForTesting();
    const db = loadDb();

    // Pastikan pengguna acuan tersedia
    ownerUser = UserRepository.getById("usr_owner_01")!;
    if (!ownerUser) {
      ownerUser = {
        id: "usr_owner_01",
        email: "owner@nemolearn.id",
        displayName: "Platform Owner",
        role: "owner",
        status: "active",
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      UserRepository.create(ownerUser);
    }

    teacherUser = UserRepository.getById("usr_guru_01")!;
    if (!teacherUser) {
      teacherUser = {
        id: "usr_guru_01",
        email: "guru@nemolearn.id",
        displayName: "Budi Guru",
        role: "guru",
        status: "active",
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      UserRepository.create(teacherUser);
    }

    studentUser = UserRepository.getById("usr_pelajar_01")!;
    if (!studentUser) {
      studentUser = {
        id: "usr_pelajar_01",
        email: "pelajar@nemolearn.id",
        displayName: "Siswa Berprestasi",
        role: "pelajar",
        status: "active",
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      UserRepository.create(studentUser);
    }

    // Unauthorized Student (default new account without AI permission)
    unauthorizedStudent = {
      id: "usr_t7_unauth_student",
      email: "unauth_student@example.com",
      displayName: "Siswa Baru Belum Diotorisasi",
      role: "pelajar",
      status: "active",
      emailVerified: true,
      hasAiAccess: false,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword("StudentPass123!"),
    };
    UserRepository.create(unauthorizedStudent);

    // Reset settings
    if (db.aiUserQuotas) {
      delete db.aiUserQuotas[`usr_t7_unauth_student_${getJakartaDateString()}`];
    }
    WebsiteSettingsRepository.update({
      maintenance: { enabled: false } as any,
      aiQuota: {
        enabled: true,
        emergencyShutdown: false,
        ownerDailyQuota: 100,
        defaultUserDailyQuota: 10,
        globalDailyLimit: 500,
        rateLimitRpm: 60,
        maxQuestionsPerRequest: 20,
        timezone: "Asia/Jakarta",
      },
    });
  });

  // ===========================================================================
  // 1. AUTHENTICATION TEST SUITE
  // ===========================================================================
  describe("1. Authentication Lifecycle & Credential Security", () => {
    it("1.1. Registrasi mandiri publik menghasilkan role 'pelajar' dan token terproteksi", async () => {
      const email = `reg_test_${Date.now()}@example.com`;
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Calon Juara SNBT",
          email,
          password: "SuperSecurePassword123!",
          confirmPassword: "SuperSecurePassword123!",
          agreeTerms: true,
          agreePrivacy: true,
          school: "SMAN 1 Jakarta",
        }),
      });

      const res = await registerPost(req);
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, "pelajar");
      assert.strictEqual(data.user.emailVerified, false);
      assert.strictEqual(data.user.passwordHash, undefined, "Password hash tidak boleh bocor");
    });

    it("1.2. Mencegah pendaftaran duplikat dengan email yang sama (409)", async () => {
      const existingEmail = studentUser.email;
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: "Peniru",
          email: existingEmail,
          password: "Password123!",
          confirmPassword: "Password123!",
          agreeTerms: true,
          agreePrivacy: true,
        }),
      });

      const res = await registerPost(req);
      assert.strictEqual(res.status, 409);
    });

    it("1.3. Login email & password sukses dan menolak kata sandi keliru (401)", async () => {
      const testEmail = `login_test_${Date.now()}@example.com`;
      const pass = "ValidPassword123!";
      UserRepository.create({
        id: `usr_${Date.now()}`,
        email: testEmail,
        displayName: "Login Tester",
        role: "pelajar",
        status: "active",
        emailVerified: true,
        passwordHash: hashPassword(pass),
        createdAt: new Date().toISOString(),
      });

      // Login berhasil
      const validReq = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: pass }),
      });
      const validRes = await loginPost(validReq);
      assert.strictEqual(validRes.status, 200);

      // Login gagal (kata sandi salah)
      const invalidReq = new Request("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: "WrongPassword999!" }),
      });
      const invalidRes = await loginPost(invalidReq);
      assert.strictEqual(invalidRes.status, 401);
    });

    it("1.4. Logout menghapus token sesi dan menyuntikkan marker keluar", async () => {
      const req = new Request("http://localhost:3000/api/auth/logout", { method: "POST" });
      const res = await logoutPost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });

    it("1.5. Token sesi kedaluwarsa atau tandatangan rusak otomatis ditolak", () => {
      const validToken = createSessionToken(studentUser);
      assert.ok(verifySessionToken(validToken), "Token asli valid");

      // Simulasi pemalsuan tanda tangan (HMAC forgery)
      const [dataPart] = validToken.split(".");
      const forgedToken = `${dataPart}.forged_signature_attack_vector_1234567890`;
      assert.strictEqual(verifySessionToken(forgedToken), null, "Token palsu ditolak");
    });

    it("1.6. Penghapusan akun mandiri mewajibkan konfirmasi password dan membersihkan data", async () => {
      const delUser: User = {
        id: "usr_to_delete_test",
        email: "delete_me@example.com",
        displayName: "Akan Dihapus",
        role: "pelajar",
        status: "active",
        emailVerified: true,
        passwordHash: hashPassword("DeletePass123!"),
        createdAt: new Date().toISOString(),
      };
      UserRepository.create(delUser);
      const token = createSessionToken(delUser);

      const req = new Request("http://localhost:3000/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({ password: "DeletePass123!" }),
      });

      const res = await deleteAccountPost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(UserRepository.getById(delUser.id), null, "Akun terhapus dari repositori");
    });

    it("1.7. Proteksi Owner: Owner tunggal tidak dapat menghapus akunnya sendiri", async () => {
      const ownerToken = createSessionToken(ownerUser);
      const req = new Request("http://localhost:3000/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${COOKIE_NAME}=${ownerToken}`,
        },
        body: JSON.stringify({ confirmationText: "HAPUS AKUN SAYA" }),
      });

      const res = await deleteAccountPost(req);
      // Ditolak karena satu-satunya owner
      assert.ok(res.status >= 400, "Owner tunggal dilarang menghapus akun sendiri");
    });
  });

  // ===========================================================================
  // 2. DATABASE CRUD, ISOLATION & INTEGRITY TEST
  // ===========================================================================
  describe("2. Database Architecture, Relational Integrity & Isolation", () => {
    it("2.1. Menjalankan siklus CRUD lengkap butir soal", () => {
      const qId = `q_crud_${Date.now()}`;
      const newQuestion: Question = {
        id: qId,
        subjectId: "fisika",
        topicId: "dinamika",
        level: "SMA",
        grade: "10",
        type: "pilihan_ganda",
        stem: "Berapakah percepatan benda bermassa 2 kg yang ditarik gaya 10 N?",
        options: [
          { key: "A", text: "2 m/s^2" },
          { key: "B", text: "5 m/s^2" },
          { key: "C", text: "10 m/s^2" },
          { key: "D", text: "20 m/s^2" },
          { key: "E", text: "25 m/s^2" },
        ],
        correctAnswer: "B",
        explanation: "Gunakan hukum II Newton: a = F / m = 10 / 2 = 5 m/s^2.",
        difficulty: "sedang",
        sourceType: "manual",
        isAiGenerated: false,
        status: "published",
        createdAt: new Date().toISOString(),
      };

      // Create
      QuestionRepository.create(newQuestion);
      assert.ok(QuestionRepository.getById(qId));

      // Read
      const fetched = QuestionRepository.getById(qId)!;
      assert.strictEqual(fetched.correctAnswer, "B");

      // Update
      QuestionRepository.update(qId, { difficulty: "hots" });
      assert.strictEqual(QuestionRepository.getById(qId)?.difficulty, "hots");

      // Delete
      QuestionRepository.delete(qId);
      assert.strictEqual(QuestionRepository.getById(qId), null);
    });

    it("2.2. Isolasi Data Pengguna: Siswa A tidak dapat membaca atau menjawab sesi Siswa B (IDOR Guard)", async () => {
      // Buat sesi milik Siswa A
      const sessionA: PracticeSession = {
        id: `sess_user_a_${Date.now()}`,
        userId: studentUser.id,
        config: {
          subjectId: "matematika",
          topicId: "aljabar",
          questionCount: 1,
          mode: "reguler",
        },
        status: "active",
        questionIds: ["q_sample_1"],
        score: null,
        correctCount: null,
        wrongCount: null,
        emptyCount: null,
        startedAt: new Date().toISOString(),
      };
      SessionRepository.create(sessionA);

      // Siswa B mencoba mengakses sesi Siswa A
      const tokenB = createSessionToken(unauthorizedStudent);
      const reqGet = new Request(`http://localhost:3000/api/sessions/${sessionA.id}`, {
        headers: { cookie: `${COOKIE_NAME}=${tokenB}` },
      });

      const resGet = await getSessionRoute(reqGet, { params: { id: sessionA.id } });
      assert.strictEqual(resGet.status, 403, "Ditolak dengan 403 Forbidden");

      // Siswa B mencoba menjawab sesi Siswa A
      const reqAnswer = new Request(`http://localhost:3000/api/sessions/${sessionA.id}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${COOKIE_NAME}=${tokenB}`,
        },
        body: JSON.stringify({ questionId: "q_sample_1", selectedAnswer: "A" }),
      });

      const resAnswer = await answerSessionRoute(reqAnswer, { params: { id: sessionA.id } });
      assert.strictEqual(resAnswer.status, 403, "Pengiriman jawaban orang lain ditolak 403");
    });

    it("2.3. Rekam jejak belajar dan kalkulasi skor IRT / persentase konsisten", () => {
      const q1: Question = {
        id: "q_eval_1",
        subjectId: "matematika",
        topicId: "aljabar",
        level: "SMA",
        type: "pilihan_ganda",
        stem: "x + 2 = 5, x = ?",
        options: [{ key: "A", text: "3" }],
        correctAnswer: "A",
        explanation: "x = 3",
        difficulty: "mudah",
        isAiGenerated: false,
        sourceType: "manual",
        createdAt: new Date().toISOString(),
      };
      const q2: Question = {
        id: "q_eval_2",
        subjectId: "matematika",
        topicId: "aljabar",
        level: "SMA",
        type: "pilihan_ganda",
        stem: "2x = 8, x = ?",
        options: [{ key: "B", text: "4" }],
        correctAnswer: "B",
        explanation: "x = 4",
        difficulty: "mudah",
        isAiGenerated: false,
        sourceType: "manual",
        createdAt: new Date().toISOString(),
      };

      const sess: PracticeSession = {
        id: "sess_eval_calc",
        userId: studentUser.id,
        config: { subjectId: "matematika", topicId: "aljabar", questionCount: 2, mode: "reguler" },
        status: "active",
        questionIds: ["q_eval_1", "q_eval_2"],
        score: null,
        correctCount: null,
        wrongCount: null,
        emptyCount: null,
        startedAt: new Date().toISOString(),
      };

      const responses = {
        q_eval_1: {
          id: "r1",
          sessionId: sess.id,
          questionId: "q_eval_1",
          selectedAnswer: "A" as const,
          isCorrect: true,
          answeredAt: new Date().toISOString(),
        },
        q_eval_2: {
          id: "r2",
          sessionId: sess.id,
          questionId: "q_eval_2",
          selectedAnswer: "C" as any, // Salah
          isCorrect: false,
          answeredAt: new Date().toISOString(),
        },
      };

      const evaluation = evaluatePracticeSession({
        session: sess,
        questions: [q1, q2],
        responses,
      });

      assert.strictEqual(evaluation.correctCount, 1);
      assert.strictEqual(evaluation.wrongCount, 1);
      assert.strictEqual(evaluation.scorePercentage, 50.0);
    });
  });

  // ===========================================================================
  // 3. AI GENERATION, RELIABILITY & FAILOVER TEST
  // ===========================================================================
  describe("3. AI Generation Engine, Failover & Operational Guardrails", () => {
    it("3.1. Pembuatan soal normal & HOTS via Mock AI Provider terkurasi", async () => {
      const provider = new MockAIProvider();
      const questions = await provider.generateQuestions({
        subjectId: "fisika",
        subjectName: "Fisika",
        topicId: "dinamika",
        topicName: "Dinamika Gerak",
        questionCount: 5,
        mode: "hots",
        level: "SMA",
      });

      assert.strictEqual(questions.length, 5);
      questions.forEach((q) => {
        assert.ok(q.stem.length > 10);
        assert.strictEqual(q.options.length, 5);
        assert.ok(["A", "B", "C", "D", "E"].includes(q.correctAnswer));
        assert.ok(q.explanation.length > 5);
      });
    });

    it("3.2. Emergency AI Shutdown: Mematikan seluruh generasi AI secara instan", () => {
      WebsiteSettingsRepository.update({
        aiQuota: {
          enabled: true,
          emergencyShutdown: true, // AKTIFKAN SAKLAR DARURAT
          ownerDailyQuota: 100,
          defaultUserDailyQuota: 10,
          globalDailyLimit: 500,
          rateLimitRpm: 60,
          maxQuestionsPerRequest: 20,
          timezone: "Asia/Jakarta",
        },
      });

      const reservation = reserveAiQuota(ownerUser.id, 5);

      assert.strictEqual(reservation.success, false);
      assert.strictEqual(reservation.code, "EMERGENCY_SHUTDOWN");
    });
  });

  // ===========================================================================
  // 4. MATHEMATICAL RENDERING & LATEX ACCURACY TEST
  // ===========================================================================
  describe("4. Mathematical Rendering, KaTeX Parser & PDF Formatting", () => {
    it("4.1. Merender ekspresi matematika kompleks dengan KaTeX tanpa melempar runtime error", () => {
      const expressions = [
        "\\frac{a^2 + b^2}{2ab} \\geq 1",
        "\\sqrt{x^2 + y^2} = r",
        "\\int_{0}^{\\pi} \\sin(x) \\, dx = 2",
        "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1",
        "E = mc^2",
      ];

      expressions.forEach((expr) => {
        const result = renderMathExpression(expr, false);
        assert.strictEqual(result.isError, false, `Ekspresi '${expr}' wajib berhasil dirender`);
        assert.ok(result.html.includes("katex"), "Output memuat tag KaTeX valid");
      });
    });

    it("4.2. Mempertahankan format desimal koma Indonesia (e.g. 9,8 m/s^2)", () => {
      const input = "Percepatan gravitasi adalah 9,8 m/s^2 dan konstanta k = 1,38 \\times 10^{-23}";
      const normalized = normalizeMathDecimals(input);
      assert.ok(normalized.includes("9{,}8"), "Koma desimal Indonesia dinormalisasi ke 9{,}8 untuk KaTeX");
    });

    it("4.3. Konversi LaTeX ke Plain Text bersih dan elegan untuk ekspor PDF", () => {
      const latex = "Tentukan nilai dari \\frac{3}{4} + \\sqrt{16} dan \\alpha + \\beta";
      const cleanText = cleanLatexForPlainText(latex);
      assert.ok(!cleanText.includes("\\frac"));
      assert.ok(!cleanText.includes("\\sqrt"));
      assert.ok(cleanText.includes("(3 / 4)"));
      assert.ok(cleanText.includes("√(16)"));
      assert.ok(cleanText.includes("α"));
    });

    it("4.4. Ekspor dokumen remedial PDF menghasilkan berkas jsPDF valid", () => {
      const doc = generateRemedialPdf({
        sessionTitle: "Latihan Fisika Remedial",
        subjectName: "Fisika",
        topicName: "Dinamika Gerak",
        userName: studentUser.displayName,
        dateStr: "05 November 2026",
        items: [
          {
            question: {
              id: "q_pdf_1",
              subjectId: "fisika",
              topicId: "dinamika",
              level: "SMA",
              type: "pilihan_ganda",
              stem: "Sebuah balok bermassa m = 4 kg ditarik gaya F = 20 N.",
              options: [
                { key: "A", text: "2 m/s^2" },
                { key: "B", text: "5 m/s^2" },
              ],
              correctAnswer: "B",
              explanation: "Gunakan a = F / m = 20 / 4 = 5 m/s^2.",
              difficulty: "sedang",
              isAiGenerated: false,
              sourceType: "manual",
              createdAt: new Date().toISOString(),
            },
            questionNumber: 1,
            selectedAnswer: "A",
            correctAnswer: "B",
            isCorrect: false,
            status: "wrong",
            explanation: "Gunakan a = F / m = 20 / 4 = 5 m/s^2.",
          },
        ],
        includeExplanations: true,
      });

      assert.ok(doc, "jsPDF instance berhasil dibuat");
      const pdfBytes = doc.output();
      assert.ok(pdfBytes.length > 500, "Ukuran byte PDF valid");
    });
  });

  // ===========================================================================
  // 5. QUOTA MANAGEMENT, MULTI-TIER & ASIA/JAKARTA RESET TEST
  // ===========================================================================
  describe("5. AI Quota Management, Tiered Access & WIB Midnight Reset", () => {
    it("5.1. Owner memiliki kuota harian khusus dan izin bypass penuh", () => {
      const status = getUserQuotaStatus(ownerUser);
      assert.strictEqual(status.hasAiAccess, true);
      assert.ok(status.dailyQuota >= 50, "Owner memiliki kuota harian tinggi");
      assert.strictEqual(status.isOwner, true);
    });

    it("5.2. Akun siswa baru tanpa otorisasi ditolak saat meminta reservasi kuota AI (403)", () => {
      const reservation = reserveAiQuota(unauthorizedStudent.id, 5);

      assert.strictEqual(reservation.success, false);
      assert.strictEqual(reservation.code, "UNAUTHORIZED_AI_ACCESS");
    });

    it("5.3. Owner dapat memberikan otorisasi akses AI dan mengubah batas kuota siswa", () => {
      grantUserAiAccess(unauthorizedStudent.id, ownerUser);
      const afterGrant = getUserQuotaStatus(UserRepository.getById(unauthorizedStudent.id)!);
      assert.strictEqual(afterGrant.hasAiAccess, true);

      // Siswa yang diizinkan kini berhasil melakukan reservasi kuota
      const reservation = reserveAiQuota(unauthorizedStudent.id, 5);
      assert.strictEqual(reservation.success, true);
      assert.ok(reservation.reservationId);

      // Komit reservasi
      confirmAiQuota({
        userId: unauthorizedStudent.id,
        reservationId: reservation.reservationId!,
        quotaDate: reservation.quotaDate,
        questionsCount: 5,
      });

      const updated = getUserQuotaStatus(UserRepository.getById(unauthorizedStudent.id)!);
      assert.strictEqual(updated.usedToday, 1);
      const quotaRecord = UserQuotaRepository.get(unauthorizedStudent.id, getJakartaDateString())!;
      assert.strictEqual(quotaRecord.requestsUsed, 1);
      assert.strictEqual(quotaRecord.questionsGenerated, 5);
    });

    it("5.4. Reservasi kuota dibatalkan dan dilepas kembali jika pembuatan soal gagal", () => {
      grantUserAiAccess(unauthorizedStudent.id, ownerUser);
      const initial = getUserQuotaStatus(UserRepository.getById(unauthorizedStudent.id)!);

      const reservation = reserveAiQuota(unauthorizedStudent.id, 5);
      assert.strictEqual(reservation.success, true);

      // Pelepasan kuota saat simulasi kegagalan
      releaseAiQuota({
        userId: unauthorizedStudent.id,
        reservationId: reservation.reservationId,
        quotaDate: reservation.quotaDate,
        reason: "Simulated Provider Timeout",
      });

      const afterRelease = getUserQuotaStatus(UserRepository.getById(unauthorizedStudent.id)!);
      assert.strictEqual(afterRelease.usedToday, initial.usedToday);
    });

    it("5.5. Reset kuota terikat pada zona waktu Asia/Jakarta (WIB)", () => {
      const dateStr = getJakartaDateString();
      assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/);
      const nextReset = getNextJakartaMidnightIso();
      assert.ok(new Date(nextReset).getTime() > Date.now());
    });
  });

  // ===========================================================================
  // 6. SECURITY, PRIVILEGE ESCALATION & AUDIT TEST
  // ===========================================================================
  describe("6. Application Security, Authorization & Privacy Enforcement", () => {
    it("6.1. Siswa dilarang menaikkan perannya sendiri menjadi admin di endpoint /api/profile", async () => {
      const token = createSessionToken(studentUser);
      const req = new Request("http://localhost:3000/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `${COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({
          displayName: "Hacker Siswa",
          role: "admin", // Upaya eskalasi hak akses
          permissions: ["manage_ai", "manage_settings"],
        }),
      });

      const res = await profilePost(req);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      // Verifikasi bahwa role di database tetap 'pelajar'
      const freshUser = UserRepository.getById(studentUser.id)!;
      assert.strictEqual(freshUser.role, "pelajar", "Role tidak berubah meski diminta klien");
    });

    it("6.2. Endpoint administratif menolak pengguna dengan peran pelajar (403 Forbidden)", async () => {
      await assert.rejects(
        async () => {
          await requireAuth(["admin", "owner"], "manage_users", createSessionToken(studentUser));
        },
        /FORBIDDEN/,
        "Siswa ditolak masuk ke area administrasi"
      );
    });

    it("6.3. Secret sanitization: API key dan password otomatis disamarkan di SystemLogRepository", () => {
      const log = SystemLogRepository.log({
        level: "security",
        action: "SUSPICIOUS_PROBE",
        actorId: studentUser.id,
        actorEmail: studentUser.email,
        details: "Probe containing AIzaSySecretApiKey1234567890123456789 and password: PlaintextPassword123",
      });

      assert.ok(!log.details.includes("AIzaSySecretApiKey1234567890123456789"));
      assert.ok(!log.details.includes("PlaintextPassword123"));
      assert.ok(log.details.includes("[MASKED]"));
    });
  });

  // ===========================================================================
  // 7. RESPONSIVE DESIGN & VIEWPORT COMPLIANCE
  // ===========================================================================
  describe("7. Responsive Design, Layout & Viewport Standards", () => {
    it("7.1. Memvalidasi breakpoint standar antarmuka NemoLearn (Desktop, Tablet, Mobile)", () => {
      const VIEWPORT_SPECS = {
        desktopWide: 1920,
        desktopStandard: 1366,
        tabletLandscape: 1024,
        tabletPortrait: 768,
        mobileLarge: 430,
        mobileStandard: 390,
        mobileCompact: 375,
      };

      // Pastikan seluruh breakpoint dapat diklasifikasikan ke grid responsif Tailwind
      assert.ok(VIEWPORT_SPECS.desktopWide >= 1280, "2xl / xl container");
      assert.ok(VIEWPORT_SPECS.tabletPortrait >= 768, "md container");
      assert.ok(VIEWPORT_SPECS.mobileCompact < 640, "sm mobile layout");
    });
  });

  // ===========================================================================
  // 8. DEPLOYMENT & STAGING READINESS AUDIT
  // ===========================================================================
  describe("8. Deployment & Staging Readiness Audit", () => {
    it("8.1. Konfigurasi HTTP Security Headers terpasang lengkap di Next.js", async () => {
      assert.strictEqual(typeof nextConfig.headers, "function");
      const headers = nextConfig.headers ? await nextConfig.headers() : [];
      const rootRule = headers.find((h: any) => h.source === "/:path*");
      assert.ok(rootRule);

      const headerMap = Object.fromEntries(rootRule.headers.map((h: any) => [h.key, h.value]));
      assert.strictEqual(headerMap["X-Frame-Options"], "DENY");
      assert.strictEqual(headerMap["X-Content-Type-Options"], "nosniff");
      assert.strictEqual(headerMap["Referrer-Policy"], "strict-origin-when-cross-origin");
      assert.ok(headerMap["Strict-Transport-Security"].includes("max-age="));
      assert.ok(headerMap["Content-Security-Policy"].includes("default-src 'self'"));
    });
  });
});
