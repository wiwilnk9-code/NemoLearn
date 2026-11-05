import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { requireAuth, hasPermission, createSessionToken, verifySessionToken } from "@/lib/auth";
import { UserRepository, loadDb, saveDb } from "@/lib/db";
import { User, AdminPermission, ALL_ADMIN_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS } from "@/types/user";

describe("TASK 1: Security & Role Management Test Suite", () => {
  const testOwner: User = {
    id: "test_owner_01",
    email: "owner.test@nemolearn.id",
    displayName: "Owner Platform Uji",
    role: "owner",
    createdAt: new Date().toISOString(),
    status: "active",
  };

  const testFullAdmin: User = {
    id: "test_admin_full",
    email: "admin.full@nemolearn.id",
    displayName: "Admin Penuh",
    role: "admin",
    permissions: ALL_ADMIN_PERMISSIONS.map((p) => p.id),
    createdAt: new Date().toISOString(),
    status: "active",
  };

  const testLimitedAdmin: User = {
    id: "test_admin_limited",
    email: "admin.limited@nemolearn.id",
    displayName: "Admin Terbatas",
    role: "admin",
    permissions: ["manage_users", "manage_questions"], // Tidak memiliki manage_ai atau manage_settings
    createdAt: new Date().toISOString(),
    status: "active",
  };

  const testPelajar: User = {
    id: "test_pelajar_01",
    email: "pelajar@siswa.sma.id",
    displayName: "Siswa Biasa",
    role: "pelajar",
    createdAt: new Date().toISOString(),
    status: "active",
  };

  const testGuru: User = {
    id: "test_guru_01",
    email: "guru@guru.sma.id",
    displayName: "Guru Fisika SMA",
    role: "guru",
    createdAt: new Date().toISOString(),
    status: "active",
  };

  beforeEach(() => {
    // Reset test users explicitly in the database
    const db = loadDb();
    db.users[testOwner.id] = { ...testOwner };
    db.users[testFullAdmin.id] = { ...testFullAdmin };
    db.users[testLimitedAdmin.id] = { ...testLimitedAdmin };
    db.users[testPelajar.id] = { ...testPelajar };
    db.users[testGuru.id] = { ...testGuru };
    saveDb(db);
  });

  describe("1. Otorisasi Peran & Permission (hasPermission & RBAC)", () => {
    it("Owner memiliki hak akses penuh ke seluruh permission sistem", () => {
      ALL_ADMIN_PERMISSIONS.forEach((perm) => {
        assert.equal(
          hasPermission(testOwner, perm.id),
          true,
          `Owner harus memiliki izin ${perm.id}`
        );
      });
    });

    it("Admin penuh memiliki seluruh izin yang didefinisikan", () => {
      ALL_ADMIN_PERMISSIONS.forEach((perm) => {
        assert.equal(
          hasPermission(testFullAdmin, perm.id),
          true,
          `Admin penuh harus memiliki izin ${perm.id}`
        );
      });
    });

    it("Admin terbatas hanya memiliki izin yang diberikan secara spesifik", () => {
      assert.equal(hasPermission(testLimitedAdmin, "manage_users"), true);
      assert.equal(hasPermission(testLimitedAdmin, "manage_questions"), true);

      // Izin yang TIDAK diberikan
      assert.equal(hasPermission(testLimitedAdmin, "manage_ai"), false);
      assert.equal(hasPermission(testLimitedAdmin, "manage_settings"), false);
      assert.equal(hasPermission(testLimitedAdmin, "view_audit_logs"), false);
    });

    it("Siswa dan guru ditolak dari seluruh permission administratif", () => {
      ALL_ADMIN_PERMISSIONS.forEach((perm) => {
        assert.equal(hasPermission(testPelajar, perm.id), false);
        assert.equal(hasPermission(testGuru, perm.id), false);
      });
    });

    it("Akun non-aktif (suspended) ditolak secara otomatis", () => {
      const suspendedAdmin: User = {
        ...testFullAdmin,
        id: "test_admin_suspended",
        status: "suspended",
      };
      assert.equal(hasPermission(suspendedAdmin, "manage_users"), false);
    });
  });

  describe("2. Integritas Database & Proteksi Akun Administratif Terakhir", () => {
    it("Mencegah penurunan pangkat (demote) admin/owner terakhir yang aktif", () => {
      // Isolasi: tinggalkan hanya 1 admin aktif dalam db
      const db = loadDb();
      Object.values(db.users).forEach((u) => {
        if (u.id !== testOwner.id && (u.role === "admin" || u.role === "owner")) {
          u.role = "pelajar";
        }
      });
      db.users[testOwner.id] = { ...testOwner, role: "owner", status: "active" };
      saveDb(db);

      assert.throws(
        () => {
          UserRepository.updateRole(testOwner.id, "pelajar");
        },
        (err: Error) => {
          assert.match(err.message, /admin\/owner terakhir/i);
          return true;
        }
      );
    });

    it("Mencegah penonaktifan (suspend) admin/owner aktif terakhir", () => {
      // Isolasi: tinggalkan hanya 1 admin aktif dalam db
      const db = loadDb();
      Object.values(db.users).forEach((u) => {
        if (u.id !== testOwner.id && (u.role === "admin" || u.role === "owner")) {
          u.role = "pelajar";
        }
      });
      db.users[testOwner.id] = { ...testOwner, role: "owner", status: "active" };
      saveDb(db);

      assert.throws(
        () => {
          UserRepository.updateStatus(testOwner.id, "suspended");
        },
        (err: Error) => {
          assert.match(err.message, /administrator aktif terakhir/i);
          return true;
        }
      );
    });

    it("Mencegah penghapusan admin/owner terakhir", () => {
      // Isolasi: tinggalkan hanya 1 admin aktif dalam db
      const db = loadDb();
      Object.values(db.users).forEach((u) => {
        if (u.id !== testOwner.id && (u.role === "admin" || u.role === "owner")) {
          u.role = "pelajar";
        }
      });
      db.users[testOwner.id] = { ...testOwner, role: "owner", status: "active" };
      saveDb(db);

      assert.throws(
        () => {
          UserRepository.delete(testOwner.id);
        },
        (err: Error) => {
          assert.match(err.message, /administrator\/owner sistem/i);
          return true;
        }
      );
    });

    it("Owner dapat memperbarui permissions admin melalui updatePermissions", () => {
      const updated = UserRepository.updatePermissions(testLimitedAdmin.id, [
        "manage_users",
        "manage_ai",
      ]);
      assert.deepEqual(updated?.permissions, ["manage_users", "manage_ai"]);

      const fetched = UserRepository.getById(testLimitedAdmin.id);
      assert.deepEqual(fetched?.permissions, ["manage_users", "manage_ai"]);
    });
  });

  describe("3. Kriptografi Token & Verifikasi Sesi", () => {
    it("Membuat token sesi yang dapat diverifikasi dengan payload yang tepat", () => {
      const token = createSessionToken(testOwner);
      assert.ok(typeof token === "string" && token.includes("."));

      const payload = verifySessionToken(token);
      assert.ok(payload);
      assert.equal(payload.userId, testOwner.id);
      assert.equal(payload.role, "owner");
      assert.equal(payload.email, testOwner.email);
    });

    it("Menolak token sesi yang dimanipulasi (tampered token)", () => {
      const token = createSessionToken(testPelajar);
      const [data, sig] = token.split(".");

      // Coba ubah payload base64 untuk meningkatkan role ke owner
      const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
      decoded.role = "owner";
      const forgedData = Buffer.from(JSON.stringify(decoded)).toString("base64");
      const forgedToken = `${forgedData}.${sig}`;

      const verified = verifySessionToken(forgedToken);
      assert.equal(verified, null, "Token yang dimanipulasi harus ditolak oleh HMAC signature.");
    });
  });
});
