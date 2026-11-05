import { describe, it } from "node:test";
import assert from "node:assert";
import { GET as getSettings, POST as postSettings } from "../app/api/admin/settings/route";
import { GET as exportAuditLogs } from "../app/api/admin/settings/audit-export/route";
import { createSessionToken, COOKIE_NAME } from "./auth/server";
import { UserRepository } from "./db";

describe("NemoLearn Task 6 — System Settings API Endpoint Tests", () => {
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
      method?: string;
      body?: any;
      token?: string;
    } = {}
  ) => {
    const headers = new Headers();
    if (options.token) {
      headers.set("cookie", `${COOKIE_NAME}=${options.token}`);
    }
    if (options.body) {
      headers.set("content-type", "application/json");
    }

    return new Request(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  it("menolak akses GET /api/admin/settings tanpa login (401)", async () => {
    const req = createRequest("http://localhost:3000/api/admin/settings");
    const res = await getSettings(req);
    assert.strictEqual(res.status, 401);
  });

  it("menolak akses GET /api/admin/settings oleh siswa (403)", async () => {
    const studentToken = createSessionToken(getStudentUser());
    const req = createRequest("http://localhost:3000/api/admin/settings", {
      token: studentToken,
    });
    const res = await getSettings(req);
    assert.strictEqual(res.status, 403);
  });

  it("mengizinkan akses GET /api/admin/settings oleh owner (200) dan mengembalikan masked vault", async () => {
    const ownerToken = createSessionToken(getAdminUser());
    const req = createRequest("http://localhost:3000/api/admin/settings", {
      token: ownerToken,
    });
    const res = await getSettings(req);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.settings);
    assert.ok(Array.isArray(data.apiVault));
    assert.ok(Array.isArray(data.governanceLogs));

    // Verifikasi API Key tidak pernah dikirim dalam bentuk plaintext
    for (const v of data.apiVault) {
      assert.strictEqual(typeof v.maskedKey, "string");
      if (v.isSet) {
        assert.ok(v.maskedKey.includes("..."));
      }
    }
  });

  it("memvalidasi panjang pesan pengumuman broadcast maksimal 140 karakter (400)", async () => {
    const ownerToken = createSessionToken(getAdminUser());
    const longMessage = "A".repeat(141);

    const req = createRequest("http://localhost:3000/api/admin/settings", {
      method: "POST",
      token: ownerToken,
      body: {
        broadcast: {
          message: longMessage,
        },
      },
    });

    const res = await postSettings(req);
    assert.strictEqual(res.status, 400);

    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes("140"));
  });

  it("memvalidasi nilai temperature AI harus berada antara 0.0 dan 1.0 (400)", async () => {
    const ownerToken = createSessionToken(getAdminUser());

    const req = createRequest("http://localhost:3000/api/admin/settings", {
      method: "POST",
      token: ownerToken,
      body: {
        aiRouting: {
          tutorTemperature: 1.5, // Invalid > 1.0
        },
      },
    });

    const res = await postSettings(req);
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("Temperature"));
  });

  it("dapat memproses rotasi API Key secara aman melalui POST action rotate_key", async () => {
    const ownerToken = createSessionToken(getAdminUser());

    const req = createRequest("http://localhost:3000/api/admin/settings", {
      method: "POST",
      token: ownerToken,
      body: {
        action: "rotate_key",
        provider: "gemini",
        apiKey: "AIzaSyTestKeyRotate1234567890abcdef",
      },
    });

    const res = await postSettings(req);
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.message.includes("berhasil diperbarui"));

    // Masked vault harus terupdate
    const geminiEntry = data.apiVault.find((v: any) => v.provider === "gemini");
    assert.ok(geminiEntry);
    assert.strictEqual(geminiEntry.isSet, true);
    assert.ok(geminiEntry.maskedKey.startsWith("AIzaSy"));
  });

  it("dapat mengunduh audit log JSON via /api/admin/settings/audit-export", async () => {
    const ownerToken = createSessionToken(getAdminUser());

    const req = createRequest("http://localhost:3000/api/admin/settings/audit-export", {
      token: ownerToken,
    });

    const res = await exportAuditLogs(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("content-type"), "application/json; charset=utf-8");
    assert.ok(res.headers.get("content-disposition")?.includes("attachment"));

    const data = await res.json();
    assert.ok(data.platform);
    assert.ok(data.exportedAt);
    assert.ok(Array.isArray(data.events));
  });
});
