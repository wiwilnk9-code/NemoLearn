import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { UserRepository, SystemLogRepository } from "@/lib/db";
import { UserRole, ALL_ADMIN_PERMISSIONS } from "@/types/user";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAuth(["admin", "owner"], "manage_users", req);
    const targetUserId = params.id;

    const user = UserRepository.getById(targetUserId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const learningStats = UserRepository.getLearningStats(targetUserId);

    return NextResponse.json({
      success: true,
      user,
      stats: learningStats,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat detail pengguna." },
      { status }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAuth(["admin", "owner"], "manage_users", req);
    const targetUserId = params.id;

    const existingUser = UserRepository.getById(targetUserId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      role,
      status,
      displayName,
      school,
      permissions,
      verificationStatus,
      verificationNote,
      nuptk,
      nip,
      subject,
      portfolioUrl,
    } = body;

    const logDetails: string[] = [];

    // Self-escalation guard: User cannot modify or elevate their own role or permissions
    if (targetUserId === admin.id && role && role !== admin.role) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: Pengguna dilarang mengubah atau menaikkan peran (role) miliknya sendiri." },
        { status: 403 }
      );
    }
    if (targetUserId === admin.id && permissions !== undefined) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: Pengguna dilarang mengubah hak izin (permissions) miliknya sendiri." },
        { status: 403 }
      );
    }

    // Role update
    if (role && role !== existingUser.role) {
      const validRoles: UserRole[] = ["pelajar", "guru", "moderator", "admin", "owner"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: `Peran tidak valid. Pilihan: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }

      // Privilege check: Only Owner can promote, demote, or alter Admin and Owner accounts
      if ((existingUser.role === "owner" || existingUser.role === "admin" || role === "owner" || role === "admin") && admin.role !== "owner") {
        return NextResponse.json(
          { success: false, error: "FORBIDDEN: Hanya akun dengan peran 'owner' yang berwenang mengangkat, menurunkan, atau mengubah peran Admin dan Owner." },
          { status: 403 }
        );
      }

      UserRepository.updateRole(targetUserId, role);
      logDetails.push(`Peran diubah dari '${existingUser.role}' ke '${role}'`);
    }

    // Permissions management (Owner only, applies to admin role)
    if (permissions !== undefined) {
      if (admin.role !== "owner") {
        return NextResponse.json(
          { success: false, error: "FORBIDDEN: Hanya Owner yang berwenang mengelola hak izin (permissions) administrator." },
          { status: 403 }
        );
      }

      const currentRole = role || existingUser.role;
      if (currentRole !== "admin") {
        return NextResponse.json(
          { success: false, error: "Pengelolaan permissions hanya berlaku untuk pengguna dengan peran 'admin'." },
          { status: 400 }
        );
      }

      const validPermIds = ALL_ADMIN_PERMISSIONS.map((p) => p.id);
      const cleanPerms = Array.isArray(permissions)
        ? permissions.filter((p: any) => validPermIds.includes(p))
        : [];

      UserRepository.updatePermissions(targetUserId, cleanPerms);
      logDetails.push(`Izin administrator disesuaikan menjadi: [${cleanPerms.join(", ")}]`);
    }

    // Status update (active / suspended)
    if (status && status !== existingUser.status) {
      if (status !== "active" && status !== "suspended") {
        return NextResponse.json(
          { success: false, error: "Status tidak valid. Pilihan: 'active' atau 'suspended'." },
          { status: 400 }
        );
      }

      // Owner cannot be suspended by anyone
      if (existingUser.role === "owner" && status === "suspended") {
        return NextResponse.json(
          { success: false, error: "FORBIDDEN: Akun Owner tidak dapat ditangguhkan (suspend)." },
          { status: 403 }
        );
      }

      // Non-owner cannot suspend an Admin
      if (existingUser.role === "admin" && status === "suspended" && admin.role !== "owner") {
        return NextResponse.json(
          { success: false, error: "FORBIDDEN: Hanya akun 'owner' yang berwenang menonaktifkan akun Admin." },
          { status: 403 }
        );
      }

      // Admin cannot suspend themselves
      if (targetUserId === admin.id && status === "suspended") {
        return NextResponse.json(
          { success: false, error: "Anda tidak dapat menonaktifkan akun Anda sendiri." },
          { status: 400 }
        );
      }

      UserRepository.updateStatus(targetUserId, status);
      logDetails.push(`Status akun diubah dari '${existingUser.status}' ke '${status}'`);
    }

    // Teacher verification update
    if (verificationStatus && verificationStatus !== existingUser.verificationStatus) {
      const validStatuses = ["unverified", "pending", "verified", "rejected"];
      if (!validStatuses.includes(verificationStatus)) {
        return NextResponse.json(
          { success: false, error: `Status verifikasi tidak valid. Pilihan: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      UserRepository.updateVerificationStatus(targetUserId, verificationStatus, verificationNote);
      logDetails.push(`Status verifikasi diubah dari '${existingUser.verificationStatus || "unverified"}' ke '${verificationStatus}'`);
    }

    // Other updates (displayName, school, nuptk, nip, subject, portfolioUrl, verificationNote)
    const partial: Record<string, any> = {};
    if (displayName && displayName.trim() !== existingUser.displayName) {
      partial.displayName = displayName.trim();
      logDetails.push(`Nama diubah ke '${displayName.trim()}'`);
    }
    if (school !== undefined && school !== existingUser.school) {
      partial.school = school.trim() || undefined;
      logDetails.push(`Asal sekolah diperbarui`);
    }
    if (nuptk !== undefined && nuptk !== existingUser.nuptk) {
      partial.nuptk = nuptk.trim() || undefined;
      logDetails.push(`NUPTK diperbarui`);
    }
    if (nip !== undefined && nip !== existingUser.nip) {
      partial.nip = nip.trim() || undefined;
      logDetails.push(`NIP diperbarui`);
    }
    if (subject !== undefined && subject !== existingUser.subject) {
      partial.subject = subject.trim() || undefined;
      logDetails.push(`Mata pelajaran diperbarui`);
    }
    if (portfolioUrl !== undefined && portfolioUrl !== existingUser.portfolioUrl) {
      partial.portfolioUrl = portfolioUrl.trim() || undefined;
      logDetails.push(`Tautan portofolio diperbarui`);
    }
    if (verificationNote !== undefined && verificationNote !== existingUser.verificationNote) {
      partial.verificationNote = verificationNote.trim() || undefined;
    }

    if (Object.keys(partial).length > 0) {
      UserRepository.update(targetUserId, partial);
    }

    const updatedUser = UserRepository.getById(targetUserId)!;

    if (logDetails.length > 0) {
      const actionName =
        verificationStatus === "verified"
          ? "TEACHER_VERIFIED"
          : verificationStatus === "rejected"
          ? "TEACHER_VERIFICATION_REJECTED"
          : role
          ? "USER_ROLE_CHANGED"
          : permissions
          ? "ADMIN_PERMISSIONS_CHANGED"
          : status
          ? "USER_STATUS_CHANGED"
          : "USER_UPDATED";

      SystemLogRepository.log({
        level: role || status || permissions || verificationStatus ? "warn" : "info",
        action: actionName,
        actorId: admin.id,
        actorEmail: admin.email,
        targetType: "user",
        targetId: targetUserId,
        details: `Admin ${admin.displayName} memperbarui pengguna ${updatedUser.displayName} (${updatedUser.email}): ${logDetails.join(", ")}.`,
      });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "Data pengguna berhasil diperbarui.",
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui pengguna." },
      { status }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAuth(["admin", "owner"], "manage_users", req);
    const targetUserId = params.id;

    if (targetUserId === admin.id) {
      return NextResponse.json(
        { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk." },
        { status: 400 }
      );
    }

    const existingUser = UserRepository.getById(targetUserId);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Owner can never be deleted by anyone
    if (existingUser.role === "owner") {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: Akun Owner sistem tidak dapat dihapus." },
        { status: 403 }
      );
    }

    // Non-owner cannot delete an Admin
    if (existingUser.role === "admin" && admin.role !== "owner") {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN: Hanya akun 'owner' yang berhak menghapus akun Admin." },
        { status: 403 }
      );
    }

    UserRepository.delete(targetUserId);

    SystemLogRepository.log({
      level: "warn",
      action: "USER_DELETED",
      actorId: admin.id,
      actorEmail: admin.email,
      targetType: "user",
      targetId: targetUserId,
      details: `Admin ${admin.displayName} menghapus akun ${existingUser.displayName} (${existingUser.email}) [Peran: ${existingUser.role}].`,
    });

    return NextResponse.json({
      success: true,
      message: `Akun pengguna ${existingUser.displayName} berhasil dihapus.`,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes("FORBIDDEN");
    const isUnauthorized = err.message?.includes("UNAUTHORIZED");
    const status = isForbidden ? 403 : isUnauthorized ? 401 : 500;

    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus pengguna." },
      { status }
    );
  }
}
