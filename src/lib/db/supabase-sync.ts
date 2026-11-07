/**
 * NemoLearn Supabase Production Sync & Data Access Layer
 * Menghubungkan seluruh repository backend NemoLearn dengan Supabase/PostgreSQL.
 * Menjamin zero-reliance pada JSON lokal saat deployment produksi.
 */

import { supabaseServer } from "@/lib/supabase/server";
import { User, UserRole } from "@/types/user";
import { Question } from "@/types/question";
import { PracticeSession } from "@/types/session";
import { SessionResponseRecord } from "@/types/response";
import { SystemLog, QuestionIssueReport } from "@/types/admin";
import { WebsiteSettings } from "@/types/settings";
import { AISettings } from "@/types/ai";
import { UserFeedback } from "@/types/feedback";
import { Announcement } from "@/types/announcement";
import { UserNotification } from "@/types/notification";
import { formatIndonesianScore } from "@/lib/scoring/format";

export function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.execArgv.some((a) => a.includes("--test")) ||
    process.argv.some((a) => a.includes("--test") || a.endsWith(".test.ts") || a.includes("test")) ||
    Boolean(process.env.VITEST) ||
    Boolean(process.env.NODE_TEST_CONTEXT)
  );
}

export async function syncUserUpsert(u: User): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    let effectiveRole = u.role;
    let effectivePermissions = u.permissions || [];

    // Anti-Demotion & Role Inconsistency Guard:
    // Mencegah akun yang sudah memiliki peran administratif (owner, admin, guru) tertimpa
    // secara tidak sengaja oleh peran default 'pelajar' akibat pembaruan profil atau sesi.
    try {
      const { data: existingDb } = await supabaseServer
        .from("users")
        .select("role, permissions")
        .eq("id", u.id)
        .maybeSingle();

      if (existingDb) {
        const adminRoles: UserRole[] = ["owner", "admin", "guru", "moderator"];
        if (adminRoles.includes(existingDb.role) && u.role === "pelajar") {
          effectiveRole = existingDb.role;
          effectivePermissions =
            existingDb.permissions && existingDb.permissions.length > 0
              ? existingDb.permissions
              : effectivePermissions;
          u.role = effectiveRole;
          u.permissions = effectivePermissions;
        }
      }

      // Periksa app_metadata di auth.users jika role belum owner
      if (effectiveRole !== "owner" && supabaseServer.auth && supabaseServer.auth.admin) {
        const { data: authUserData } = await supabaseServer.auth.admin.getUserById(u.id);
        if (authUserData?.user?.app_metadata?.role === "owner") {
          effectiveRole = "owner";
          effectivePermissions = [
            "manage_users",
            "manage_questions",
            "manage_sessions",
            "view_analytics",
            "manage_ai",
            "manage_settings",
            "view_audit_logs",
          ];
          u.role = effectiveRole;
          u.permissions = effectivePermissions;
        }
      }
    } catch (checkErr) {
      console.warn("[SupabaseSync Anti-Demotion Guard] Check skipped:", checkErr);
    }

    const { error } = await supabaseServer.from("users").upsert({
      id: u.id,
      auth_provider_id: u.authProviderId || null,
      email: u.email,
      display_name: u.displayName,
      role: effectiveRole,
      school: u.school || null,
      gender: u.gender || "rahasia",
      avatar_url: u.avatarUrl || null,
      status: u.status || "active",
      verification_status: u.verificationStatus || "unverified",
      nuptk: u.nuptk || null,
      subject: u.subject || null,
      portfolio_url: u.portfolioUrl || null,
      verification_note: u.verificationNote || null,
      permissions: effectivePermissions,
      password_hash: u.passwordHash || null,
      email_verified: Boolean(u.emailVerified),
      verification_token: u.verificationToken || null,
      verification_token_expires: u.verificationTokenExpires || null,
      reset_password_token: u.resetPasswordToken || null,
      reset_password_expires: u.resetPasswordExpires || null,
      tos_accepted_at: u.tosAcceptedAt || null,
      privacy_accepted_at: u.privacyAcceptedAt || null,
      tos_version: u.tosVersion || "2026.11",
      privacy_version: u.privacyVersion || "2026.11",
      parental_consent: Boolean(u.parentalConsentConfirmed),
      auth_provider: u.authProvider || "email",
      has_ai_access: Boolean(u.hasAiAccess),
      daily_ai_quota_override: u.dailyAiQuotaOverride || null,
      ai_access_granted_by: u.aiAccessGrantedBy || null,
      ai_access_granted_at: u.aiAccessGrantedAt || null,
      created_at: u.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: u.lastActiveAt || new Date().toISOString(),
    });
    if (error) {
      console.error("[SupabaseSync] Failed to upsert user:", error.message);
    }

    // Jika user adalah owner, pastikan app_metadata Supabase Auth selalu tersinkronisasi
    if (effectiveRole === "owner" && supabaseServer.auth && supabaseServer.auth.admin) {
      try {
        await supabaseServer.auth.admin.updateUserById(u.id, {
          app_metadata: { role: "owner" },
        });
      } catch {}
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncUserUpsert exception:", err?.message || err);
  }
}

export async function syncUserDelete(userId: string): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("users").delete().eq("id", userId);
    if (error) {
      console.error("[SupabaseSync] Failed to delete user:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncUserDelete exception:", err?.message || err);
  }
}

export async function syncQuestionUpsert(q: Question): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("questions").upsert({
      id: q.id,
      subject_id: q.subjectId,
      topic_id: q.topicId,
      subtopic: q.subtopic || null,
      level: q.level || "SMA",
      type: q.type || "pilihan_ganda",
      stem: q.stem,
      options_json: q.options || [],
      correct_answer: q.correctAnswer,
      explanation: q.explanation || "",
      is_ai_generated: Boolean(q.isAiGenerated),
      difficulty: q.difficulty || "sedang",
      source_type: q.sourceType || "curated_bank",
      source_id: q.sourceId || null,
      status: q.status || "published",
      version: q.version || 1,
      hint: q.hint || null,
      created_at: q.createdAt || new Date().toISOString(),
    });
    if (error) {
      console.error("[SupabaseSync] Failed to upsert question:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncQuestionUpsert exception:", err?.message || err);
  }
}

export async function syncQuestionBatchUpsert(questions: Question[]): Promise<void> {
  if (isTestEnvironment()) return;
  if (!questions || questions.length === 0) return;
  try {
    const records = questions.map((q) => ({
      id: q.id,
      subject_id: q.subjectId,
      topic_id: q.topicId,
      subtopic: q.subtopic || null,
      level: q.level || "SMA",
      type: q.type || "pilihan_ganda",
      stem: q.stem,
      options_json: q.options || [],
      correct_answer: q.correctAnswer,
      explanation: q.explanation || "",
      is_ai_generated: Boolean(q.isAiGenerated),
      difficulty: q.difficulty || "sedang",
      source_type: q.sourceType || "curated_bank",
      source_id: q.sourceId || null,
      status: q.status || "published",
      version: q.version || 1,
      hint: q.hint || null,
      created_at: q.createdAt || new Date().toISOString(),
    }));

    const { error } = await supabaseServer.from("questions").upsert(records);
    if (error) {
      console.error("[SupabaseSync] Failed to upsert question batch:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncQuestionBatchUpsert exception:", err?.message || err);
  }
}

export async function syncQuestionDelete(questionId: string): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("questions").delete().eq("id", questionId);
    if (error) {
      console.error("[SupabaseSync] Failed to delete question:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncQuestionDelete exception:", err?.message || err);
  }
}

export async function syncSessionUpsert(s: PracticeSession): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("practice_sessions").upsert({
      id: s.id,
      user_id: s.userId,
      config_json: s.config,
      status: s.status,
      question_ids_json: s.questionIds || [],
      score: s.score,
      correct_count: s.correctCount,
      wrong_count: s.wrongCount,
      empty_count: s.emptyCount,
      started_at: s.startedAt,
      completed_at: s.completedAt || null,
    });
    if (error) {
      console.error("[SupabaseSync] Failed to upsert session:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncSessionUpsert exception:", err?.message || err);
  }
}

export async function syncResponseUpsert(r: SessionResponseRecord): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("responses").upsert({
      id: `${r.sessionId}_${r.questionId}`,
      session_id: r.sessionId,
      question_id: r.questionId,
      answer: r.selectedAnswer || null,
      is_correct: r.isCorrect ?? null,
      answered_at: r.answeredAt || new Date().toISOString(),
    });
    if (error) {
      console.error("[SupabaseSync] Failed to upsert response:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncResponseUpsert exception:", err?.message || err);
  }
}

export async function fetchSessionByIdFromSupabase(sessionId: string): Promise<PracticeSession | null> {
  if (isTestEnvironment() || !sessionId) return null;
  try {
    const { data, error } = await supabaseServer
      .from("practice_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();

    if (error) {
      console.error("[SupabaseSync] fetchSessionById error:", error.message);
      return null;
    }
    if (!data) return null;

    const numScore = data.score !== null && data.score !== undefined ? Number(data.score) : null;
    const session: PracticeSession = {
      id: data.id,
      userId: data.user_id,
      config: data.config_json || {},
      status: data.status || "active",
      questionIds: Array.isArray(data.question_ids_json) ? data.question_ids_json : [],
      score: numScore,
      scoreFormatted: numScore !== null ? formatIndonesianScore(numScore) : null,
      correctCount: data.correct_count ?? null,
      wrongCount: data.wrong_count ?? null,
      emptyCount: data.empty_count ?? null,
      startedAt: data.started_at,
      completedAt: data.completed_at || undefined,
    };
    return session;
  } catch (err: any) {
    console.error("[SupabaseSync Error] fetchSessionById exception:", err?.message || err);
    return null;
  }
}

export async function fetchQuestionsByIdsFromSupabase(questionIds: string[]): Promise<Question[]> {
  if (isTestEnvironment() || !questionIds || questionIds.length === 0) return [];
  try {
    const { data, error } = await supabaseServer
      .from("questions")
      .select("*")
      .in("id", questionIds);

    if (error) {
      console.error("[SupabaseSync] fetchQuestionsByIds error:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map((row) => ({
      id: row.id,
      subjectId: row.subject_id,
      topicId: row.topic_id,
      subtopic: row.subtopic || undefined,
      level: row.level || "SMA",
      type: row.type || "pilihan_ganda",
      stem: row.stem,
      options: Array.isArray(row.options_json) ? row.options_json : [],
      correctAnswer: row.correct_answer,
      explanation: row.explanation || "",
      isAiGenerated: Boolean(row.is_ai_generated),
      difficulty: row.difficulty || "sedang",
      sourceType: row.source_type || "curated_bank",
      sourceId: row.source_id || undefined,
      status: row.status || "published",
      version: row.version || 1,
      hint: row.hint || undefined,
      createdAt: row.created_at,
    }));
  } catch (err: any) {
    console.error("[SupabaseSync Error] fetchQuestionsByIds exception:", err?.message || err);
    return [];
  }
}

export async function fetchResponsesBySessionIdFromSupabase(sessionId: string): Promise<SessionResponseRecord[]> {
  if (isTestEnvironment() || !sessionId) return [];
  try {
    const { data, error } = await supabaseServer
      .from("responses")
      .select("*")
      .eq("session_id", sessionId);

    if (error) {
      console.error("[SupabaseSync] fetchResponsesBySessionId error:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    return data.map((row) => ({
      id: row.id || `${row.session_id}:${row.question_id}`,
      sessionId: row.session_id,
      questionId: row.question_id,
      selectedAnswer: row.answer || null,
      isCorrect: row.is_correct ?? null,
      answeredAt: row.answered_at,
    }));
  } catch (err: any) {
    console.error("[SupabaseSync Error] fetchResponsesBySessionId exception:", err?.message || err);
    return [];
  }
}

export async function syncAnnouncementUpsert(a: Announcement): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("announcements").upsert({
      id: a.id,
      title: a.title,
      message: a.message,
      type: a.type || "info",
      target_role: a.targetRole || "all",
      is_active: a.isActive,
      valid_until: a.validUntil || null,
      created_at: a.createdAt || new Date().toISOString(),
      created_by: a.createdBy || null,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error("[SupabaseSync] Failed to upsert announcement:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncAnnouncementUpsert exception:", err?.message || err);
  }
}

export async function syncAnnouncementDelete(id: string): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("announcements").delete().eq("id", id);
    if (error) {
      console.error("[SupabaseSync] Failed to delete announcement:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncAnnouncementDelete exception:", err?.message || err);
  }
}

export async function fetchActiveAnnouncementsFromSupabase(): Promise<Announcement[]> {
  if (isTestEnvironment()) return [];
  try {
    const { data, error } = await supabaseServer
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SupabaseSync] fetchActiveAnnouncements error:", error.message);
      return [];
    }
    if (!data) return [];

    return data
      .map((row) => ({
        id: row.id,
        title: row.title,
        message: row.message,
        type: row.type as any,
        targetRole: row.target_role as any,
        isActive: Boolean(row.is_active),
        validUntil: row.valid_until || null,
        createdAt: row.created_at,
        createdBy: row.created_by || null,
        updatedAt: row.updated_at || undefined,
      }))
      .filter((a) => !a.validUntil || new Date(a.validUntil).getTime() > Date.now());
  } catch (err: any) {
    console.error("[SupabaseSync Error] fetchActiveAnnouncements exception:", err?.message || err);
    return [];
  }
}

export async function fetchAllAnnouncementsFromSupabase(): Promise<Announcement[]> {
  if (isTestEnvironment()) return [];
  try {
    const { data, error } = await supabaseServer
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[SupabaseSync] fetchAllAnnouncements error:", error.message);
      return [];
    }
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type as any,
      targetRole: row.target_role as any,
      isActive: Boolean(row.is_active),
      validUntil: row.valid_until || null,
      createdAt: row.created_at,
      createdBy: row.created_by || null,
      updatedAt: row.updated_at || undefined,
    }));
  } catch (err: any) {
    console.error("[SupabaseSync Error] fetchAllAnnouncements exception:", err?.message || err);
    return [];
  }
}

export async function syncNotificationUpsert(n: UserNotification): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("notifications").upsert({
      id: n.id,
      user_id: n.userId,
      title: n.title,
      message: n.message,
      type: n.type || "system",
      is_read: n.isRead,
      read_at: n.readAt || null,
      link: n.link || null,
      created_at: n.createdAt || new Date().toISOString(),
    });
    if (error) {
      console.error("[SupabaseSync] Failed to upsert notification:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncNotificationUpsert exception:", err?.message || err);
  }
}

export async function syncNotificationMarkRead(id: string, readAt: string): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("id", id);
    if (error) {
      console.error("[SupabaseSync] Failed to mark notification read:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncNotificationMarkRead exception:", err?.message || err);
  }
}

export async function syncNotificationMarkAllRead(userId: string, readAt: string): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer
      .from("notifications")
      .update({ is_read: true, read_at: readAt })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) {
      console.error("[SupabaseSync] Failed to mark all notifications read:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncNotificationMarkAllRead exception:", err?.message || err);
  }
}

export async function fetchUserNotificationsFromSupabase(userId: string): Promise<UserNotification[]> {
  if (isTestEnvironment() || !userId) return [];
  try {
    const { data, error } = await supabaseServer
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[SupabaseSync] fetchUserNotifications error:", error.message);
      return [];
    }
    if (!data) return [];

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type as any,
      isRead: Boolean(row.is_read),
      readAt: row.read_at || null,
      link: row.link || null,
      createdAt: row.created_at,
    }));
  } catch (err: any) {
    console.error("[SupabaseSync Error] fetchUserNotifications exception:", err?.message || err);
    return [];
  }
}

export async function syncReportUpsert(rep: QuestionIssueReport): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("reports").upsert({
      id: rep.id,
      question_id: rep.questionId || rep.targetId || "unknown",
      reporter_id: rep.reporterId || rep.actorId,
      reporter_email: rep.reporterEmail || null,
      reporter_name: rep.reporterName || null,
      issue_type: rep.issueType || rep.action || "other",
      description: rep.description || rep.reason || "",
      status: rep.status,
      admin_notes: rep.adminNotes || rep.notes || null,
      created_at: rep.createdAt,
      resolved_at: rep.resolvedAt || null,
      resolved_by: rep.resolvedBy || null,
    });
    if (error) {
      console.error("[SupabaseSync] Failed to upsert report:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncReportUpsert exception:", err?.message || err);
  }
}

export async function syncFeedbackUpsert(f: UserFeedback): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("feedbacks").upsert({
      id: f.id,
      user_id: f.userId || null,
      user_email: f.userEmail || null,
      user_name: f.userName || null,
      type: f.type,
      category: f.category || "general",
      subject: f.subject,
      message: f.message,
      rating: f.rating || null,
      status: f.status,
      admin_response: f.adminResponse || null,
      created_at: f.createdAt,
      resolved_at: f.resolvedAt || null,
    });
    if (error) {
      console.warn("[SupabaseSync] Notice on feedback upsert:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncFeedbackUpsert exception:", err?.message || err);
  }
}

export async function syncSystemLogInsert(l: SystemLog): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("system_logs").insert({
      id: l.id,
      level: l.level || "info",
      action: l.action,
      actor_id: l.actorId || null,
      actor_email: l.actorEmail || null,
      actor_name: l.actorName || null,
      actor_role: l.actorRole || null,
      target_type: l.targetType || null,
      target_id: l.targetId || null,
      ip_address: l.ipAddress || l.ip || null,
      user_agent: l.userAgent || l.payload?.userAgent || null,
      details: l.details || "",
      status: l.status || "SUCCESS",
      category: l.category || "system",
      payload: l.payload || {},
      created_at: l.timestamp || l.createdAt || new Date().toISOString(),
    });
    if (error) {
      console.error("[SupabaseSync] Failed to insert system log:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncSystemLogInsert exception:", err?.message || err);
  }
}

export async function syncAIMetricInsert(m: any): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("ai_metrics_history").insert({
      id: m.requestId ? `aim_${m.requestId}` : `aim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      request_id: m.requestId || `gen_${Date.now()}`,
      timestamp: m.timestamp || new Date().toISOString(),
      provider: m.provider,
      model: m.model,
      success: Boolean(m.success),
      latency_ms: m.latencyMs || null,
      error: m.error || null,
      request_type: m.requestType || "question_generation",
      depth: m.depth || null,
      cache_hit: Boolean(m.cacheHit),
      subject: m.subject || null,
      topic: m.topic || null,
      subtopic: m.subtopic || null,
      question_count: m.questionCount || null,
      generated_count: m.generatedCount || null,
      status: m.status || "SUCCESS",
      retry_count: m.retryCount || 0,
      is_fallback: Boolean(m.isFallback),
      prompt_tokens: m.tokenUsage?.promptTokens || 0,
      completion_tokens: m.tokenUsage?.completionTokens || 0,
      total_tokens: m.tokenUsage?.totalTokens || 0,
      estimated_cost_usd: m.estimatedCostUsd || 0,
    });
    if (error) {
      console.error("[SupabaseSync] Failed to insert AI metric:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncAIMetricInsert exception:", err?.message || err);
  }
}

export interface AiUserQuotaRecord {
  id: string;
  userId: string;
  quotaDate: string;
  requestsUsed: number;
  requestsReserved: number;
  questionsGenerated: number;
  tokensConsumed: number;
  lastRequestAt: string;
}

export async function syncUserQuotaUpsert(q: AiUserQuotaRecord): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("ai_user_quotas").upsert({
      id: q.id,
      user_id: q.userId,
      quota_date: q.quotaDate,
      requests_used: q.requestsUsed,
      requests_reserved: q.requestsReserved,
      questions_generated: q.questionsGenerated,
      tokens_consumed: q.tokensConsumed,
      last_request_at: q.lastRequestAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error("[SupabaseSync] Failed to upsert user quota:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncUserQuotaUpsert exception:", err?.message || err);
  }
}

export async function syncWebsiteSettingsUpsert(ws: WebsiteSettings): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("website_settings").upsert({
      id: "global",
      site_name: ws.siteName,
      tagline: ws.tagline,
      description: ws.description,
      curriculum: ws.curriculum,
      logo_url: ws.logoUrl || null,
      enable_ai_generator: ws.enableAIGenerator,
      enable_irt_scoring: ws.enableIRTScoring,
      enable_pdf_export: ws.enablePdfExport,
      maintenance_mode: ws.maintenanceMode,
      allow_public_registration: ws.allowPublicRegistration,
      app_info_json: ws.appInfo || {},
      maintenance_json: ws.maintenance || {},
      broadcast_json: ws.broadcast || {},
      rate_limits_json: ws.rateLimits || {},
      ai_routing_json: ws.aiRouting || {},
      ai_quota: ws.aiQuota || null,
      security_json: ws.security || {},
      updated_at: new Date().toISOString(),
      updated_by: ws.updatedBy || null,
    });
    if (error) {
      console.error("[SupabaseSync] Failed to upsert website settings:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncWebsiteSettingsUpsert exception:", err?.message || err);
  }
}

export async function syncAISettingsUpsert(ais: AISettings): Promise<void> {
  if (isTestEnvironment()) return;
  try {
    const { error } = await supabaseServer.from("ai_settings").upsert({
      id: "global",
      provider: ais.provider,
      api_key_encrypted: ais.apiKey || null,
      model: ais.model,
      base_url: ais.baseUrl || null,
      timeout_ms: ais.timeoutMs || 20000,
      provider_keys_json: ais.providerKeys || {},
      updated_at: new Date().toISOString(),
      updated_by: ais.updatedBy || null,
    });
    if (error) {
      console.error("[SupabaseSync] Failed to upsert AI settings:", error.message);
    }
  } catch (err: any) {
    console.error("[SupabaseSync Error] syncAISettingsUpsert exception:", err?.message || err);
  }
}

/**
 * Hydrate state directly from Supabase on cold start / server reboot
 */
export async function hydrateFromSupabase(): Promise<{
  users?: Record<string, User>;
  questions?: Record<string, Question>;
  sessions?: Record<string, PracticeSession>;
  websiteSettings?: WebsiteSettings;
  systemLogs?: SystemLog[];
} | null> {
  try {
    // 1. Fetch Users
    const { data: usersData, error: uErr } = await supabaseServer.from("users").select("*");
    if (uErr) {
      console.warn("[SupabaseHydrate] Users query skipped:", uErr.message);
      return null;
    }

    const users: Record<string, User> = {};
    if (usersData) {
      for (const row of usersData) {
        users[row.id] = {
          id: row.id,
          email: row.email,
          displayName: row.display_name,
          role: row.role,
          school: row.school || undefined,
          gender: row.gender || undefined,
          avatarUrl: row.avatar_url || undefined,
          status: row.status,
          verificationStatus: row.verification_status,
          nuptk: row.nuptk || undefined,
          subject: row.subject || undefined,
          portfolioUrl: row.portfolio_url || undefined,
          verificationNote: row.verification_note || undefined,
          permissions: row.permissions || [],
          passwordHash: row.password_hash || undefined,
          emailVerified: Boolean(row.email_verified),
          verificationToken: row.verification_token || undefined,
          verificationTokenExpires: row.verification_token_expires || undefined,
          resetPasswordToken: row.reset_password_token || undefined,
          resetPasswordExpires: row.reset_password_expires || undefined,
          tosAcceptedAt: row.tos_accepted_at || undefined,
          privacyAcceptedAt: row.privacy_accepted_at || undefined,
          tosVersion: row.tos_version || "2026.11",
          privacyVersion: row.privacy_version || "2026.11",
          parentalConsentConfirmed: Boolean(row.parental_consent),
          authProvider: row.auth_provider || "email",
          authProviderId: row.auth_provider_id || undefined,
          hasAiAccess: Boolean(row.has_ai_access),
          dailyAiQuotaOverride: row.daily_ai_quota_override || undefined,
          aiAccessGrantedBy: row.ai_access_granted_by || undefined,
          aiAccessGrantedAt: row.ai_access_granted_at || undefined,
          createdAt: row.created_at,
          lastActiveAt: row.last_active_at,
        };
      }
    }

    // 2. Fetch Questions
    const { data: questionsData, error: qErr } = await supabaseServer.from("questions").select("*");
    const questions: Record<string, Question> = {};
    if (!qErr && questionsData) {
      for (const row of questionsData) {
        questions[row.id] = {
          id: row.id,
          subjectId: row.subject_id,
          topicId: row.topic_id,
          subtopic: row.subtopic || undefined,
          level: row.level,
          type: row.type,
          stem: row.stem,
          options: row.options_json || [],
          correctAnswer: row.correct_answer,
          explanation: row.explanation,
          isAiGenerated: row.is_ai_generated,
          difficulty: row.difficulty,
          sourceType: row.source_type,
          sourceId: row.source_id || undefined,
          status: row.status,
          version: row.version,
          hint: row.hint || undefined,
          createdAt: row.created_at,
        };
      }
    }

    // 3. Fetch Website Settings
    const { data: wsData } = await supabaseServer.from("website_settings").select("*").eq("id", "global").maybeSingle();
    let websiteSettings: WebsiteSettings | undefined;
    if (wsData) {
      websiteSettings = {
        siteName: wsData.site_name,
        tagline: wsData.tagline,
        description: wsData.description,
        curriculum: wsData.curriculum,
        logoUrl: wsData.logo_url,
        enableAIGenerator: wsData.enable_ai_generator,
        enableIRTScoring: wsData.enable_irt_scoring,
        enablePdfExport: wsData.enable_pdf_export,
        maintenanceMode: wsData.maintenance_mode,
        allowPublicRegistration: wsData.allow_public_registration,
        appInfo: wsData.app_info_json || {},
        maintenance: wsData.maintenance_json || {},
        broadcast: wsData.broadcast_json || {},
        rateLimits: wsData.rate_limits_json || {},
        aiRouting: wsData.ai_routing_json || {},
        aiQuota: wsData.ai_quota || undefined,
        security: wsData.security_json || {},
        updatedAt: wsData.updated_at,
        updatedBy: wsData.updated_by,
      };
    }

    return { users, questions, websiteSettings };
  } catch (err: any) {
    console.error("[SupabaseHydrate Error]:", err?.message || err);
    return null;
  }
}

export async function fetchWebsiteSettingsFromSupabase(): Promise<WebsiteSettings | null> {
  if (isTestEnvironment()) return null;
  try {
    const { data: wsData, error } = await supabaseServer
      .from("website_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();

    if (error || !wsData) return null;

    return {
      siteName: wsData.site_name,
      tagline: wsData.tagline,
      description: wsData.description,
      curriculum: wsData.curriculum,
      logoUrl: wsData.logo_url,
      enableAIGenerator: Boolean(wsData.enable_ai_generator),
      enableIRTScoring: Boolean(wsData.enable_irt_scoring),
      enablePdfExport: Boolean(wsData.enable_pdf_export),
      maintenanceMode: Boolean(wsData.maintenance_mode),
      allowPublicRegistration: Boolean(wsData.allow_public_registration),
      appInfo: wsData.app_info_json || {},
      maintenance: wsData.maintenance_json || {},
      broadcast: wsData.broadcast_json || {},
      rateLimits: wsData.rate_limits_json || {},
      aiRouting: wsData.ai_routing_json || {},
      aiQuota: wsData.ai_quota || undefined,
      security: wsData.security_json || {},
      updatedAt: wsData.updated_at,
      updatedBy: wsData.updated_by,
    };
  } catch (err: any) {
    console.warn("[Supabase] Failed to fetch live website settings:", err?.message || err);
    return null;
  }
}
