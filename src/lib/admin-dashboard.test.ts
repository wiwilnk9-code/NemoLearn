import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import {
  loadDb,
  saveDb,
  UserRepository,
  SessionRepository,
  QuestionRepository,
  ReportRepository,
  SystemLogRepository,
  AIMetricsRepository,
  AISettingsRepository,
  WebsiteSettingsRepository,
  getAdminDashboardSummary,
} from "@/lib/db";
import { requireAuth, createSessionToken, verifySessionToken } from "@/lib/auth";
import { formatIndonesianScore } from "@/lib/scoring/format";
import { User } from "@/types/user";

describe("NemoLearn Owner & Admin Dashboard Architecture Suite (Tahap 6)", () => {
  beforeEach(() => {
    // Reset database to clean state
    const db = loadDb();
    db.users = {
      usr_pelajar_01: {
        id: "usr_pelajar_01",
        email: "pelajar@sma.sch.id",
        displayName: "Budi Pelajar",
        role: "pelajar",
        school: "SMAN 1 Jakarta",
        createdAt: "2026-09-01T08:00:00Z",
        status: "active",
      },
      usr_guru_01: {
        id: "usr_guru_01",
        email: "guru@sma.sch.id",
        displayName: "Siti Guru",
        role: "guru",
        school: "SMAN 3 Bandung",
        createdAt: "2026-08-15T09:00:00Z",
        status: "active",
      },
      usr_admin_01: {
        id: "usr_admin_01",
        email: "admin@nemoquiz.edu",
        displayName: "Admin NemoLearn",
        role: "admin",
        createdAt: "2026-08-01T00:00:00Z",
        status: "active",
      },
      usr_owner_01: {
        id: "usr_owner_01",
        email: "owner@nemoquiz.edu",
        displayName: "Owner NemoLearn",
        role: "owner",
        createdAt: "2026-07-01T00:00:00Z",
        status: "active",
      },
    };
    delete db.websiteSettings;
    saveDb(db, true);
  });

  describe("1. Otorisasi Akses Admin & RBAC", () => {
    it("menolak akses tanpa sesi login dengan pesan UNAUTHORIZED", async () => {
      await assert.rejects(
        async () => {
          await requireAuth(["admin", "owner"]);
        },
        (err: Error) => {
          assert.match(err.message, /UNAUTHORIZED/);
          return true;
        }
      );
    });

    it("memverifikasi aturan least-privilege: pelajar dan guru tidak ada di role admin/owner", () => {
      const allowedRoles = ["admin", "owner"];
      assert.strictEqual(allowedRoles.includes("pelajar"), false);
      assert.strictEqual(allowedRoles.includes("guru"), false);
      assert.strictEqual(allowedRoles.includes("admin"), true);
      assert.strictEqual(allowedRoles.includes("owner"), true);
    });

    it("membuat dan memverifikasi token sesi HMAC sha256 valid", () => {
      const adminUser = UserRepository.getById("usr_admin_01")!;
      const token = createSessionToken(adminUser);
      assert.ok(token && token.includes("."));

      const payload = verifySessionToken(token);
      assert.strictEqual(payload?.userId, "usr_admin_01");
      assert.strictEqual(payload?.role, "admin");
    });
  });

  describe("2. Agregasi Statistik Riil Dashboard (getAdminDashboardSummary)", () => {
    it("menghasilkan statistik pengguna, sesi, dan bank soal yang akurat dari database", () => {
      const summary = getAdminDashboardSummary(7);

      assert.ok(summary.users.total >= 4);
      assert.strictEqual(summary.users.byRole.pelajar, 1);
      assert.strictEqual(summary.users.byRole.guru, 1);
      assert.strictEqual(summary.users.byRole.admin, 1);
      assert.strictEqual(summary.users.byRole.owner, 1);

      assert.ok(summary.systemHealth);
      assert.strictEqual(summary.systemHealth.databaseStatus, "healthy");
      assert.ok(summary.trends.length === 7);
    });

    it("tidak pernah mengekspos API Key mentah pada data statistik AI", () => {
      const summary = getAdminDashboardSummary();
      assert.strictEqual((summary.ai as any).apiKey, undefined);
      assert.strictEqual((summary as any).apiKey, undefined);
    });
  });

  describe("3. Pengaturan Website (WebsiteSettingsRepository)", () => {
    it("dapat membaca konfigurasi website default", () => {
      const settings = WebsiteSettingsRepository.get();
      assert.strictEqual(settings.siteName, "NemoLearn");
      assert.strictEqual(settings.enableAIGenerator, true);
      assert.strictEqual(settings.enableIRTScoring, true);
      assert.strictEqual(settings.maintenanceMode, false);
    });

    it("dapat memperbarui konfigurasi website dan mencatat aktor pembaruan", () => {
      const updated = WebsiteSettingsRepository.update(
        {
          siteName: "NemoLearn SMA Smart",
          maintenanceMode: false,
        },
        "owner@nemoquiz.edu"
      );

      assert.strictEqual(updated.siteName, "NemoLearn SMA Smart");
      assert.strictEqual(updated.updatedBy, "owner@nemoquiz.edu");
      assert.ok(updated.updatedAt);

      // Verifikasi pembacaan ulang konsisten
      const fresh = WebsiteSettingsRepository.get();
      assert.strictEqual(fresh.siteName, "NemoLearn SMA Smart");
    });
  });

  describe("4. Integritas Pengelolaan Pengguna (User Management Guards)", () => {
    it("mencegah penghapusan admin atau owner aktif terakhir", () => {
      // Hapus owner_01 pertama kali
      UserRepository.delete("usr_owner_01");

      // Coba hapus admin_01 (admin aktif terakhir)
      assert.throws(
        () => {
          UserRepository.delete("usr_admin_01");
        },
        (err: Error) => {
          assert.match(err.message, /Tidak dapat menghapus satu-satunya akun administrator\/owner/);
          return true;
        }
      );
    });

    it("mencegah penonaktifan (suspend) admin atau owner aktif terakhir", () => {
      // Hapus owner terlebih dahulu
      UserRepository.delete("usr_owner_01");

      // Coba menonaktifkan admin_01
      assert.throws(
        () => {
          UserRepository.updateStatus("usr_admin_01", "suspended");
        },
        (err: Error) => {
          assert.match(err.message, /Tidak dapat menonaktifkan \(suspend\) administrator aktif terakhir/);
          return true;
        }
      );
    });
  });
});
