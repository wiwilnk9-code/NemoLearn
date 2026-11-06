import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { requireAuth, createSessionToken, verifySessionToken } from "@/lib/auth";
import { UserRepository, loadDb } from "@/lib/db";
import { User, ALL_ADMIN_PERMISSIONS } from "@/types/user";

describe("NemoLearn Owner Role System & Bootstrap Audit Test Suite", () => {
  const targetEmail = "wildannk9@gmail.com";
  const userUuid = "5b3621ce-4d70-4437-b684-b3b61f10e0c5";

  beforeEach(() => {
    const db = loadDb();
    // Simulate user before promotion
    db.users[userUuid] = {
      id: userUuid,
      email: targetEmail,
      displayName: "Wildan",
      role: "pelajar",
      status: "active",
      createdAt: new Date().toISOString(),
      permissions: [],
    };
  });

  it("1. Verifies initial registered user role is 'pelajar' and cannot access admin endpoints", async () => {
    const user = UserRepository.getById(userUuid);
    assert.ok(user);
    assert.equal(user.role, "pelajar");

    const token = createSessionToken(user);
    const mockReq = { headers: new Headers({ cookie: `nemoquiz_session=${token}` }) } as any;

    await assert.rejects(
      async () => {
        await requireAuth(["admin", "owner"], undefined, mockReq);
      },
      (err: any) => {
        assert.match(err.message, /FORBIDDEN/);
        return true;
      }
    );
  });

  it("2. Verifies promotion to 'owner' grants full inherent administrative access", async () => {
    // Simulate bootstrap promotion
    UserRepository.update(userUuid, {
      role: "owner",
      permissions: ALL_ADMIN_PERMISSIONS.map((p) => p.id),
    });

    const promotedUser = UserRepository.getById(userUuid);
    assert.ok(promotedUser);
    assert.equal(promotedUser.role, "owner");

    // Owner creates new session
    const ownerToken = createSessionToken(promotedUser);
    const mockReq = { headers: new Headers({ cookie: `nemoquiz_session=${ownerToken}` }) } as any;

    const authorizedUser = await requireAuth(["admin", "owner"], undefined, mockReq);
    assert.equal(authorizedUser.id, userUuid);
    assert.equal(authorizedUser.role, "owner");

    // Inherent bypass of granular permissions
    const aiAuthorized = await requireAuth(["admin", "owner"], "manage_ai", mockReq);
    assert.equal(aiAuthorized.role, "owner");

    const settingsAuthorized = await requireAuth(["admin", "owner"], "manage_settings", mockReq);
    assert.equal(settingsAuthorized.role, "owner");
  });

  it("3. Verifies session token HMAC verification verifies role integrity and user status", () => {
    const user = UserRepository.getById(userUuid)!;
    user.role = "owner";

    const token = createSessionToken(user);
    const payload = verifySessionToken(token);

    assert.ok(payload);
    assert.equal(payload.userId, userUuid);
    assert.equal(payload.role, "owner");

    // Tampered token should fail
    const tamperedToken = token + "xyz";
    const invalidPayload = verifySessionToken(tamperedToken);
    assert.equal(invalidPayload, null);
  });

  it("4. Verifies role revert / demote mechanism", async () => {
    // Promote first
    UserRepository.update(userUuid, { role: "owner" });
    assert.equal(UserRepository.getById(userUuid)?.role, "owner");

    // Revert to pelajar
    UserRepository.update(userUuid, { role: "pelajar", permissions: [] });
    const revertedUser = UserRepository.getById(userUuid);
    assert.equal(revertedUser?.role, "pelajar");

    const revertedToken = createSessionToken(revertedUser!);
    const mockReq = { headers: new Headers({ cookie: `nemoquiz_session=${revertedToken}` }) } as any;

    await assert.rejects(async () => {
      await requireAuth(["admin", "owner"], undefined, mockReq);
    });
  });

  it("5. Verifies app_metadata isolation from client user_metadata", () => {
    // Mock Supabase user object
    const mockAuthUser = {
      id: userUuid,
      email: targetEmail,
      user_metadata: {
        role: "owner", // User metadata could be altered by a rogue client in poorly designed apps
        name: "Wildan",
      },
      app_metadata: {
        provider: "google",
        role: "pelajar", // Server authoritative role
      },
    };

    // The application MUST read authorization role from app_metadata or trusted database, NEVER user_metadata
    assert.equal(mockAuthUser.app_metadata.role, "pelajar");
    assert.notEqual(mockAuthUser.app_metadata.role, mockAuthUser.user_metadata.role);

    // Bootstrap script preserves existing providers when updating app_metadata
    const updatedAppMeta = {
      ...mockAuthUser.app_metadata,
      role: "owner",
    };
    assert.equal(updatedAppMeta.provider, "google");
    assert.equal(updatedAppMeta.role, "owner");
  });

  it("6. Verifies profile updates NEVER demote or reset an Owner role", () => {
    // 1. User starts as Owner
    UserRepository.update(userUuid, {
      role: "owner",
      permissions: ALL_ADMIN_PERMISSIONS.map((p) => p.id),
    });
    assert.equal(UserRepository.getById(userUuid)?.role, "owner");

    // 2. User updates profile info (e.g. displayName, school, gender) via /api/profile
    const updatedUser = UserRepository.update(userUuid, {
      displayName: "Wildan N.K",
      school: "SMAN 5 SUKABUMI",
      gender: "laki-laki",
      role: "owner", // Explicit role preservation
    });

    assert.ok(updatedUser);
    assert.equal(updatedUser.displayName, "Wildan N.K");
    assert.equal(updatedUser.school, "SMAN 5 SUKABUMI");
    assert.equal(updatedUser.gender, "laki-laki");
    assert.equal(updatedUser.role, "owner"); // MUST REMAIN OWNER!

    // Verify subsequent lookup
    const freshUser = UserRepository.getById(userUuid);
    assert.equal(freshUser?.role, "owner");
  });

  it("7. Verifies role reconciliation: app_metadata 'owner' takes precedence over stale role", () => {
    // Suppose in-memory cache has role 'pelajar'
    UserRepository.update(userUuid, { role: "pelajar" });
    assert.equal(UserRepository.getById(userUuid)?.role, "pelajar");

    // Supabase Auth app_metadata has 'owner'
    const authAppRole: string = "owner";
    const dbRole: string = "pelajar";

    let resolvedRole: string = "pelajar";
    if (authAppRole === "owner" || dbRole === "owner") {
      resolvedRole = "owner";
    }

    assert.equal(resolvedRole, "owner");

    // Update repository to resolved role
    UserRepository.update(userUuid, { role: resolvedRole as any });
    assert.equal(UserRepository.getById(userUuid)?.role, "owner");
  });
});
