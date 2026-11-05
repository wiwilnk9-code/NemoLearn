import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { UserRepository, SystemLogRepository } from "@/lib/db";
import { User, UserRole, ALL_ADMIN_PERMISSIONS, DEFAULT_ADMIN_PERMISSIONS } from "@/types/user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireAuth(["admin", "owner"], "manage_users", req);

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const role = (url.searchParams.get("role") || "all") as UserRole | "all";
    const status = (url.searchParams.get("status") || "all") as "active" | "suspended" | "all";
    const verificationStatus = (url.searchParams.get("verificationStatus") || "all") as
      | "unverified"
      | "pending"
      | "verified"
      | "rejected"
      | "all";
    const dateRange = url.searchParams.get("dateRange") || undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const result = UserRepository.getAll({
      search,
      role,
      status,
      verificationStatus,
      dateRange,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      users: result.users,
      total: result.total,
      stats: result.stats,
      page,
      limit,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat data pengguna." },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], "manage_users", req);
    const body = await req.json();

    const {
      email,
      displayName,
      role,
      school,
      gender,
      permissions,
      nuptk,
      nip,
      subject,
      portfolioUrl,
      verificationNote,
      bypassVerification,
    } = body;

    if (!email || !displayName || !role) {
      return NextResponse.json(
        { success: false, error: "Field email, nama lengkap (displayName), dan peran (role) wajib diisi." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Format alamat email tidak valid." },
        { status: 400 }
      );
    }

    const existing = UserRepository.getByEmail(email);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email sudah digunakan oleh akun lain." },
        { status: 409 }
      );
    }

    const validRoles: UserRole[] = ["pelajar", "guru", "moderator", "admin", "owner"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Peran tidak valid. Pilihan: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Role Escalation Protection: Only Owner can create Admin or Owner accounts
    if ((role === "admin" || role === "owner") && admin.role !== "owner") {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: Hanya Owner yang berwenang membuat akun dengan peran Admin atau Owner." },
        { status: 403 }
      );
    }

    // Process granular permissions for new Admin
    let assignedPermissions = undefined;
    if (role === "admin") {
      const validPermIds = ALL_ADMIN_PERMISSIONS.map((p) => p.id);
      if (Array.isArray(permissions)) {
        assignedPermissions = permissions.filter((p: any) => validPermIds.includes(p));
      } else {
        assignedPermissions = [...DEFAULT_ADMIN_PERMISSIONS];
      }
    }

    // Set initial verification status
    let initialVerificationStatus: User["verificationStatus"] = "unverified";
    if (role === "guru") {
      initialVerificationStatus = bypassVerification ? "verified" : "pending";
    } else if (role === "admin" || role === "owner") {
      initialVerificationStatus = "verified";
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      role,
      permissions: assignedPermissions,
      school: school?.trim() || undefined,
      gender: gender || "rahasia",
      nuptk: nuptk?.trim() || undefined,
      nip: nip?.trim() || undefined,
      subject: subject?.trim() || undefined,
      portfolioUrl: portfolioUrl?.trim() || undefined,
      verificationNote: verificationNote?.trim() || undefined,
      verificationStatus: initialVerificationStatus,
      createdAt: new Date().toISOString(),
      status: "active",
      lastActiveAt: new Date().toISOString(),
    };

    UserRepository.create(newUser);

    SystemLogRepository.log({
      level: "info",
      action: "USER_CREATED",
      actorId: admin.id,
      actorEmail: admin.email,
      targetType: "user",
      targetId: newUser.id,
      details: `Admin ${admin.displayName} membuat pengguna baru: ${newUser.displayName} (${newUser.email}) dengan peran ${newUser.role}.`,
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: "Pengguna berhasil ditambahkan.",
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat pengguna baru." },
      { status }
    );
  }
}
