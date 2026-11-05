import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import {
  hasPermission,
  isAdmin,
  isOwner,
  canAccessAdminDashboard,
} from "./auth/permissions";
import { User, AdminPermission } from "@/types/user";
import { createSessionToken, verifySessionToken, COOKIE_NAME } from "./auth/server";

describe("AUTH SERVER / CLIENT BOUNDARY & PERMISSIONS SUITE", () => {
  const dummyOwner: User = {
    id: "usr_owner_01",
    email: "owner@nemoquiz.edu",
    displayName: "Platform Owner",
    role: "owner",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  const dummyFullAdmin: User = {
    id: "usr_admin_full",
    email: "admin_full@nemoquiz.edu",
    displayName: "Admin Full",
    role: "admin",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  const dummyRestrictedAdmin: User = {
    id: "usr_admin_restricted",
    email: "admin_questions@nemoquiz.edu",
    displayName: "Admin Soal Saja",
    role: "admin",
    status: "active",
    permissions: ["manage_questions"],
    createdAt: new Date().toISOString(),
  };

  const dummyStudent: User = {
    id: "usr_pelajar_01",
    email: "budi@sman1.edu",
    displayName: "Budi Santoso",
    role: "pelajar",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  const dummyTeacher: User = {
    id: "usr_guru_01",
    email: "guru@sman1.edu",
    displayName: "Siti Rahmawati, S.Pd",
    role: "guru",
    status: "active",
    createdAt: new Date().toISOString(),
  };

  const dummySuspendedAdmin: User = {
    id: "usr_admin_suspended",
    email: "suspended@nemoquiz.edu",
    displayName: "Admin Suspended",
    role: "admin",
    status: "suspended",
    createdAt: new Date().toISOString(),
  };

  // Test 1: Boundary Verification (Client Component Safety)
  describe("1. Client Component Boundary Verification", () => {
    it("permissions.ts must NOT import next/headers or server modules", () => {
      const filePath = path.resolve(process.cwd(), "src/lib/auth/permissions.ts");
      const content = fs.readFileSync(filePath, "utf-8");

      assert.strictEqual(
        /from\s+["']next\/headers["']/.test(content),
        false,
        "permissions.ts must not import from next/headers"
      );
      assert.strictEqual(
        /from\s+["']crypto["']/.test(content) || /require\(["']crypto["']\)/.test(content),
        false,
        "permissions.ts must not import crypto"
      );
      assert.strictEqual(
        /from\s+["']fs["']/.test(content) || /require\(["']fs["']\)/.test(content),
        false,
        "permissions.ts must not import fs"
      );
    });

    it("client.ts must NOT import next/headers or server modules", () => {
      const filePath = path.resolve(process.cwd(), "src/lib/auth/client.ts");
      const content = fs.readFileSync(filePath, "utf-8");

      assert.strictEqual(
        /from\s+["']next\/headers["']/.test(content),
        false,
        "client.ts must not import from next/headers"
      );
      assert.strictEqual(
        /from\s+["']crypto["']/.test(content) || /require\(["']crypto["']\)/.test(content),
        false,
        "client.ts must not import crypto"
      );
    });

    it("AdminSidebar.tsx must NOT import next/headers or server auth hub", () => {
      const filePath = path.resolve(process.cwd(), "src/components/admin/AdminSidebar.tsx");
      const content = fs.readFileSync(filePath, "utf-8");

      assert.strictEqual(
        content.includes("from \"@/lib/auth\"") || content.includes("from '@/lib/auth'"),
        false,
        "AdminSidebar.tsx must not import server auth directly"
      );
      assert.ok(
        content.includes("@/lib/auth/permissions"),
        "AdminSidebar.tsx should import from @/lib/auth/permissions"
      );
    });
  });

  // Test 2: Granular Role & Permission Evaluation
  describe("2. Granular Permissions Evaluation (hasPermission)", () => {
    it("Owner must have ALL permissions inherently", () => {
      const allPerms: AdminPermission[] = [
        "manage_users",
        "manage_questions",
        "manage_sessions",
        "view_analytics",
        "manage_ai",
        "manage_settings",
        "view_audit_logs",
      ];
      for (const perm of allPerms) {
        assert.strictEqual(
          hasPermission(dummyOwner, perm),
          true,
          `Owner should have ${perm}`
        );
      }
    });

    it("Full Admin must have default admin permissions", () => {
      assert.strictEqual(hasPermission(dummyFullAdmin, "manage_users"), true);
      assert.strictEqual(hasPermission(dummyFullAdmin, "manage_questions"), true);
      assert.strictEqual(hasPermission(dummyFullAdmin, "manage_sessions"), true);
      assert.strictEqual(hasPermission(dummyFullAdmin, "view_analytics"), true);
      assert.strictEqual(hasPermission(dummyFullAdmin, "view_audit_logs"), true);
      // manage_ai & manage_settings are not default unless explicitly granted or owner
      assert.strictEqual(hasPermission(dummyFullAdmin, "manage_ai"), false);
      assert.strictEqual(hasPermission(dummyFullAdmin, "manage_settings"), false);
    });

    it("Restricted Admin must only have granted permissions", () => {
      assert.strictEqual(hasPermission(dummyRestrictedAdmin, "manage_questions"), true);
      assert.strictEqual(hasPermission(dummyRestrictedAdmin, "manage_users"), false);
      assert.strictEqual(hasPermission(dummyRestrictedAdmin, "view_analytics"), false);
      assert.strictEqual(hasPermission(dummyRestrictedAdmin, "manage_ai"), false);
    });

    it("Students and Teachers must NOT have any admin permissions", () => {
      assert.strictEqual(hasPermission(dummyStudent, "manage_users"), false);
      assert.strictEqual(hasPermission(dummyStudent, "view_analytics"), false);
      assert.strictEqual(hasPermission(dummyTeacher, "manage_questions"), false);
      assert.strictEqual(hasPermission(dummyTeacher, "manage_users"), false);
    });

    it("Suspended users must be denied all permissions", () => {
      assert.strictEqual(hasPermission(dummySuspendedAdmin, "manage_users"), false);
      assert.strictEqual(hasPermission(dummySuspendedAdmin, "manage_questions"), false);
    });

    it("Null or undefined user must be denied all permissions", () => {
      assert.strictEqual(hasPermission(null, "manage_users"), false);
      assert.strictEqual(hasPermission(undefined, "manage_users"), false);
    });
  });

  // Test 3: Dashboard Access Guards
  describe("3. Dashboard Access Checks", () => {
    it("isAdmin returns true for active admin and owner", () => {
      assert.strictEqual(isAdmin(dummyOwner), true);
      assert.strictEqual(isAdmin(dummyFullAdmin), true);
      assert.strictEqual(isAdmin(dummyStudent), false);
      assert.strictEqual(isAdmin(dummyTeacher), false);
      assert.strictEqual(isAdmin(dummySuspendedAdmin), false);
      assert.strictEqual(isAdmin(null), false);
    });

    it("isOwner returns true only for active owner", () => {
      assert.strictEqual(isOwner(dummyOwner), true);
      assert.strictEqual(isOwner(dummyFullAdmin), false);
      assert.strictEqual(isOwner(dummyStudent), false);
    });

    it("canAccessAdminDashboard matches isAdmin criteria", () => {
      assert.strictEqual(canAccessAdminDashboard(dummyOwner), true);
      assert.strictEqual(canAccessAdminDashboard(dummyFullAdmin), true);
      assert.strictEqual(canAccessAdminDashboard(dummyStudent), false);
      assert.strictEqual(canAccessAdminDashboard(dummyTeacher), false);
    });
  });

  // Test 4: Server Session Cryptographic Signing & Validation
  describe("4. Server Session Cryptographic Tokens", () => {
    it("creates a verifiable HMAC session token", () => {
      const token = createSessionToken(dummyOwner);
      assert.ok(token.includes("."), "Token must be dot-delimited data and signature");

      const verified = verifySessionToken(token);
      assert.ok(verified, "Token must be valid");
      assert.strictEqual(verified?.userId, dummyOwner.id);
      assert.strictEqual(verified?.role, dummyOwner.role);
      assert.strictEqual(verified?.email, dummyOwner.email);
      assert.ok(verified?.expiresAt > Date.now());
    });

    it("rejects tampered or forged session tokens", () => {
      const validToken = createSessionToken(dummyStudent);
      const [data, signature] = validToken.split(".");

      // Tamper data payload to escalate role to owner
      const decoded = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
      decoded.role = "owner";
      const tamperedData = Buffer.from(JSON.stringify(decoded)).toString("base64");
      const tamperedToken = `${tamperedData}.${signature}`;

      const verified = verifySessionToken(tamperedToken);
      assert.strictEqual(verified, null, "Tampered token must be rejected");
    });
  });
});
