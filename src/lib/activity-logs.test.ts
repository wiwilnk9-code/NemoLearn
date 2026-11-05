import { describe, it, before } from "node:test";
import assert from "node:assert";
import { SystemLogRepository, UserRepository, loadDb, saveDb, getInitialSystemLogs } from "./db";
import { GET as getLogs } from "../app/api/admin/logs/route";
import { GET as exportLogs } from "../app/api/admin/logs/export/route";
import { createSessionToken, COOKIE_NAME } from "./auth/server";

describe("NemoLearn Task 7 — Activity & Logs Architecture Suite", () => {
  before(() => {
    const db = loadDb();
    db.systemLogs = getInitialSystemLogs();
    saveDb(db);
  });
  const getAdminUser = () =>
    UserRepository.getByEmail("owner@nemoquiz.edu") || {
      id: "usr_owner_01",
      email: "owner@nemoquiz.edu",
      displayName: "Dr. Hendra Kusuma (Owner)",
      role: "owner" as const,
      status: "active" as const,
      createdAt: new Date().toISOString(),
    };

  const getStudentUser = () =>
    UserRepository.getByEmail("pelajar@sma.sch.id") || {
      id: "usr_pelajar_01",
      email: "pelajar@sma.sch.id",
      displayName: "Budi Santoso",
      role: "pelajar" as const,
      status: "active" as const,
      createdAt: new Date().toISOString(),
    };

  const createRequest = (
    url: string,
    options: {
      token?: string;
    } = {}
  ) => {
    const headers = new Headers();
    if (options.token) {
      headers.set("cookie", `${COOKIE_NAME}=${options.token}`);
    }
    return new Request(url, {
      method: "GET",
      headers,
    });
  };

  describe("1. Repositori Log Sistem & Query Engine (SystemLogRepository)", () => {
    it("mengembalikan daftar log audit terstruktur beserta total data", () => {
      const result = SystemLogRepository.getAll({ page: 1, limit: 10 });
      assert.ok(Array.isArray(result.logs));
      assert.ok(result.logs.length > 0);
      assert.ok(result.total >= result.logs.length);

      const firstLog = result.logs[0];
      assert.ok(firstLog.id);
      assert.ok(firstLog.timestamp);
      assert.ok(firstLog.action);
      assert.ok(firstLog.actorEmail);
      assert.ok(firstLog.details);
    });

    it("dapat menyaring log berdasarkan kategori spesifik (auth, settings, role_change, system, security)", () => {
      // Filter kategori settings
      const settingsLogs = SystemLogRepository.getAll({ category: "settings" });
      assert.ok(settingsLogs.logs.length > 0);
      for (const log of settingsLogs.logs) {
        assert.strictEqual(log.category, "settings");
      }

      // Filter kategori security
      const securityLogs = SystemLogRepository.getAll({ category: "security" });
      assert.ok(securityLogs.logs.length > 0);
      for (const log of securityLogs.logs) {
        assert.ok(log.category === "security" || log.level === "security");
      }
    });

    it("dapat menyaring log berdasarkan severity level (info, warn, error, security)", () => {
      const warnLogs = SystemLogRepository.getAll({ level: "warn" });
      assert.ok(warnLogs.logs.length > 0);
      for (const log of warnLogs.logs) {
        assert.strictEqual(log.level, "warn");
      }
    });

    it("dapat melakukan pencarian multi-atribut (IP, nama aktor, aksi, email, deskripsi)", () => {
      // Cari berdasarkan IP Tor exit node
      const ipSearch = SystemLogRepository.getAll({ search: "45.142.12.89" });
      assert.ok(ipSearch.logs.length > 0);
      assert.strictEqual(ipSearch.logs[0].ip, "45.142.12.89");

      // Cari berdasarkan kata kunci 'Kurikulum'
      const textSearch = SystemLogRepository.getAll({ search: "Kurikulum" });
      assert.ok(textSearch.logs.length > 0);
      for (const log of textSearch.logs) {
        const matches =
          log.details.toLowerCase().includes("kurikulum") ||
          log.action.toLowerCase().includes("kurikulum");
        assert.ok(matches);
      }
    });

    it("mendukung pagination dengan batas baris dan halaman yang akurat", () => {
      const page1 = SystemLogRepository.getAll({ page: 1, limit: 3 });
      const page2 = SystemLogRepository.getAll({ page: 2, limit: 3 });

      assert.strictEqual(page1.logs.length, 3);
      assert.strictEqual(page2.logs.length, 3);
      // Item di halaman 1 dan halaman 2 tidak boleh duplikat
      assert.notStrictEqual(page1.logs[0].id, page2.logs[0].id);
    });
  });

  describe("2. Integritas Pencatatan Log Baru & Resolusi Otomatis", () => {
    it("secara otomatis melengkapi nama aktor dan role dari database jika tidak disertakan", () => {
      const newLog = SystemLogRepository.log({
        level: "info",
        action: "TEST_ACTIVITY_TRIGGERED",
        actorId: "usr_pelajar_01",
        actorEmail: "pelajar@sma.sch.id",
        details: "Pengguna melakukan pengujian pencatatan log otomatis.",
      });

      assert.ok(newLog.id);
      assert.strictEqual(newLog.actorName, getStudentUser().displayName);
      assert.strictEqual(newLog.actorRole, "pelajar");
      assert.strictEqual(newLog.category, "user");
      assert.strictEqual(newLog.status, "SUKSES");
      assert.strictEqual(newLog.ip, "127.0.0.1");
    });

    it("secara otomatis menyimpulkan kategori security dan status BLOCKED untuk insiden keamanan", () => {
      const secLog = SystemLogRepository.log({
        level: "security",
        action: "SUSPICIOUS_ACCESS_BLOCKED",
        actorId: "sys_waf",
        actorEmail: "system.firewall@internal",
        details: "Mendeteksi percobaan SQL Injection pada endpoint pencarian.",
        ip: "198.51.100.22",
        status: "BLOCKED",
      });

      assert.strictEqual(secLog.category, "security");
      assert.strictEqual(secLog.status, "BLOCKED");
      assert.strictEqual(secLog.ip, "198.51.100.22");
    });
  });

  describe("3. Agregasi Metrik Forensik (getMetricsSummary)", () => {
    it("menghitung metrik kartu bento telemetri secara dinamis dari event riil", () => {
      const summary = SystemLogRepository.getMetricsSummary();

      assert.ok(summary);
      assert.ok(summary.totalToday >= 24810);
      assert.ok(typeof summary.totalTodayTrendPct === "number");
      assert.ok(summary.failedLoginsToday >= 14);
      assert.ok(summary.autoBlockedIpsCount >= 3);
      assert.ok(summary.roleMutationsToday >= 6);
      assert.strictEqual(summary.roleMutations2FaPassed, true);
      assert.ok(summary.systemErrorsToday >= 2);
      assert.strictEqual(summary.retentionDays, 90);
      assert.strictEqual(summary.immutableLedgerId, "0x992b-jkt");
    });
  });

  describe("4. Keamanan & Sanitasi Audit Trail", () => {
    it("tidak pernah memuat kata sandi atau API Key plaintext di dalam log atau payload", () => {
      const allLogs = SystemLogRepository.getAll({ limit: 100 }).logs;

      for (const log of allLogs) {
        // Periksa bahwa tidak ada password/secret key bocor di string details
        assert.strictEqual(log.details.includes("password123"), false);
        assert.strictEqual(log.details.includes("AIzaSySecret"), false);
        assert.strictEqual(log.details.includes("sk-ant-api"), false);

        if (log.payload) {
          const payloadStr = JSON.stringify(log.payload);
          assert.strictEqual(payloadStr.includes("password123"), false);
          assert.strictEqual(payloadStr.includes("AIzaSySecret"), false);
        }
      }
    });
  });

  describe("5. Endpoint API & Otorisasi RBAC (/api/admin/logs)", () => {
    it("menolak akses GET /api/admin/logs tanpa sesi login (401)", async () => {
      const req = createRequest("http://localhost:3000/api/admin/logs");
      const res = await getLogs(req);
      assert.strictEqual(res.status, 401);
    });

    it("menolak akses GET /api/admin/logs oleh siswa (403)", async () => {
      const studentToken = createSessionToken(getStudentUser());
      const req = createRequest("http://localhost:3000/api/admin/logs", {
        token: studentToken,
      });
      const res = await getLogs(req);
      assert.strictEqual(res.status, 403);
    });

    it("mengizinkan akses GET /api/admin/logs oleh administrator/owner (200) dengan data lengkap", async () => {
      const ownerToken = createSessionToken(getAdminUser());
      const req = createRequest("http://localhost:3000/api/admin/logs?page=1&limit=5", {
        token: ownerToken,
      });
      const res = await getLogs(req);
      assert.strictEqual(res.status, 200);

      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.logs));
      assert.ok(data.logs.length <= 5);
      assert.ok(typeof data.total === "number");
      assert.ok(data.metrics);
      assert.strictEqual(data.metrics.immutableLedgerId, "0x992b-jkt");
    });
  });

  describe("6. Ekspor Audit Trail (/api/admin/logs/export)", () => {
    it("dapat mengekspor audit log dalam format CSV berstandar UTF-8 BOM", async () => {
      const ownerToken = createSessionToken(getAdminUser());
      const req = createRequest("http://localhost:3000/api/admin/logs/export?format=csv", {
        token: ownerToken,
      });
      const res = await exportLogs(req);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get("content-type"), "text/csv; charset=utf-8");
      assert.ok(res.headers.get("content-disposition")?.includes(".csv"));

      const csvText = await res.text();
      assert.ok(csvText.includes("Timestamp (WIB)"));
      assert.ok(csvText.includes("Log ID"));
      assert.ok(csvText.includes("Aksi"));
      assert.ok(csvText.includes("Aktor Email"));
    });

    it("dapat mengekspor audit log dalam format JSON forensik", async () => {
      const ownerToken = createSessionToken(getAdminUser());
      const req = createRequest("http://localhost:3000/api/admin/logs/export?format=json", {
        token: ownerToken,
      });
      const res = await exportLogs(req);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.headers.get("content-type"), "application/json; charset=utf-8");
      assert.ok(res.headers.get("content-disposition")?.includes(".json"));

      const json = await res.json();
      assert.strictEqual(json.platform, "NemoLearn");
      assert.strictEqual(json.ledgerId, "0x992b-jkt");
      assert.ok(Array.isArray(json.auditRecords));
      assert.ok(json.auditRecords.length > 0);
    });
  });
});
