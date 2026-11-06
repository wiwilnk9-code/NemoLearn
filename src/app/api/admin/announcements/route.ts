import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { AnnouncementRepository, SystemLogRepository } from "@/lib/db";
import { Announcement } from "@/types/announcement";
import { broadcastRealtimeEvent } from "@/lib/realtime/broadcast";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], undefined, req);
    const announcements = await AnnouncementRepository.getAll();

    return NextResponse.json({
      success: true,
      announcements,
      admin: { id: admin.id, email: admin.email, role: admin.role },
    });
  } catch (err: any) {
    const status = err.message?.includes("FORBIDDEN") ? 403 : err.message?.includes("UNAUTHORIZED") ? 401 : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat daftar pengumuman." },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], undefined, req);
    const body = await req.json().catch(() => ({}));
    const { title, message, type = "info", targetRole = "all", validUntil } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ success: false, error: "Judul pengumuman wajib diisi." }, { status: 400 });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ success: false, error: "Isi pesan pengumuman wajib diisi." }, { status: 400 });
    }

    const newAnnouncement: Announcement = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      message: message.trim(),
      type: ["info", "warning", "danger", "maintenance"].includes(type) ? type : "info",
      targetRole: ["all", "pelajar", "guru", "admin", "owner"].includes(targetRole) ? targetRole : "all",
      isActive: true,
      validUntil: validUntil || null,
      createdAt: new Date().toISOString(),
      createdBy: admin.email,
    };

    const saved = await AnnouncementRepository.create(newAnnouncement);

    // Broadcast in real-time to all connected clients
    await broadcastRealtimeEvent("nemo-announcements", "NEW_ANNOUNCEMENT", saved);

    SystemLogRepository.log({
      level: "info",
      action: "ANNOUNCEMENT_CREATED",
      actorId: admin.id,
      actorEmail: admin.email,
      targetType: "announcement",
      targetId: saved.id,
      details: `Pengumuman baru dibuat [${saved.title}] (${saved.type.toUpperCase()}) oleh ${admin.email}`,
    });

    return NextResponse.json({
      success: true,
      announcement: saved,
      message: "Pengumuman berhasil diterbitkan.",
    });
  } catch (err: any) {
    const status = err.message?.includes("FORBIDDEN") ? 403 : err.message?.includes("UNAUTHORIZED") ? 401 : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat pengumuman." },
      { status }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], undefined, req);
    const body = await req.json().catch(() => ({}));
    const { id, title, message, type, targetRole, isActive, validUntil } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "ID pengumuman wajib disertakan." }, { status: 400 });
    }

    const partial: Partial<Announcement> = {};
    if (title !== undefined) partial.title = String(title).trim();
    if (message !== undefined) partial.message = String(message).trim();
    if (type !== undefined && ["info", "warning", "danger", "maintenance"].includes(type)) partial.type = type;
    if (targetRole !== undefined && ["all", "pelajar", "guru", "admin", "owner"].includes(targetRole)) partial.targetRole = targetRole;
    if (isActive !== undefined) partial.isActive = Boolean(isActive);
    if (validUntil !== undefined) partial.validUntil = validUntil || null;

    const updated = await AnnouncementRepository.update(id, partial);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Pengumuman tidak ditemukan." }, { status: 404 });
    }

    // Broadcast update in real-time
    await broadcastRealtimeEvent("nemo-announcements", "UPDATE_ANNOUNCEMENT", updated);

    SystemLogRepository.log({
      level: "info",
      action: "ANNOUNCEMENT_UPDATED",
      actorId: admin.id,
      actorEmail: admin.email,
      targetType: "announcement",
      targetId: id,
      details: `Pengumuman [${updated.title}] diperbarui (Aktif: ${updated.isActive}) oleh ${admin.email}`,
    });

    return NextResponse.json({
      success: true,
      announcement: updated,
      message: "Pengumuman berhasil diperbarui.",
    });
  } catch (err: any) {
    const status = err.message?.includes("FORBIDDEN") ? 403 : err.message?.includes("UNAUTHORIZED") ? 401 : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui pengumuman." },
      { status }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await requireAuth(["admin", "owner"], undefined, req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Parameter ID pengumuman wajib disertakan." }, { status: 400 });
    }

    await AnnouncementRepository.delete(id);
    await broadcastRealtimeEvent("nemo-announcements", "DELETE_ANNOUNCEMENT", { id });

    SystemLogRepository.log({
      level: "warn",
      action: "ANNOUNCEMENT_DELETED",
      actorId: admin.id,
      actorEmail: admin.email,
      targetType: "announcement",
      targetId: id,
      details: `Pengumuman [ID: ${id}] dihapus oleh ${admin.email}`,
    });

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil dihapus.",
    });
  } catch (err: any) {
    const status = err.message?.includes("FORBIDDEN") ? 403 : err.message?.includes("UNAUTHORIZED") ? 401 : 500;
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus pengumuman." },
      { status }
    );
  }
}
