import { User } from "@/types/user";
import { AiQuotaConfig } from "@/types/settings";
import {
  UserRepository,
  UserQuotaRepository,
  WebsiteSettingsRepository,
  DEFAULT_WEBSITE_SETTINGS,
  SystemLogRepository,
} from "@/lib/db";
import { AiUserQuotaRecord } from "@/lib/db/supabase-sync";

export const DEFAULT_AI_QUOTA_CONFIG: AiQuotaConfig = {
  enabled: true,
  emergencyShutdown: false,
  ownerDailyQuota: 50,
  defaultUserDailyQuota: 10,
  globalDailyLimit: 200,
  globalDailyQuestionsLimit: 2000,
  rateLimitRpm: 5,
  maxQuestionsPerRequest: 15,
  timezone: "Asia/Jakarta",
};

/**
 * Returns current date formatted as YYYY-MM-DD in Asia/Jakarta (WIB) timezone
 */
export function getJakartaDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Calculates next 00:00:00 WIB in ISO format (Asia/Jakarta daily reset)
 */
export function getNextJakartaMidnightIso(referenceDate: Date = new Date()): string {
  const todayStr = getJakartaDateString(referenceDate);
  const [year, month, day] = todayStr.split("-").map(Number);
  // 00:00 WIB = 17:00 UTC previous day (UTC+7)
  const nextDayMidnightUtc = new Date(Date.UTC(year, month - 1, day + 1, 0 - 7, 0, 0, 0));
  return nextDayMidnightUtc.toISOString();
}

/**
 * Active reservation in-memory store
 */
export interface ActiveReservation {
  id: string;
  userId: string;
  quotaDate: string;
  requestedQuestions: number;
  createdAt: number;
}

const activeReservations = new Map<string, ActiveReservation>();
const userRequestTimestamps = new Map<string, number[]>();

/**
 * Reset rate limits & reservations (primarily for test isolation)
 */
export function resetRateLimitsForTesting(): void {
  userRequestTimestamps.clear();
  activeReservations.clear();
}

/**
 * Check if user exceeds sliding-window rate limit (default 5 RPM)
 */
export function checkRateLimit(
  userId: string,
  rpmLimit: number = 5
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = (userRequestTimestamps.get(userId) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= rpmLimit) {
    const oldest = timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  timestamps.push(now);
  userRequestTimestamps.set(userId, timestamps);

  // Periodic cleanup if map grows
  if (userRequestTimestamps.size > 1000) {
    userRequestTimestamps.forEach((list, uid) => {
      const active = list.filter((t: number) => now - t < windowMs);
      if (active.length === 0) userRequestTimestamps.delete(uid);
      else userRequestTimestamps.set(uid, active);
    });
  }

  return { allowed: true };
}

/**
 * Fetch current AI quota configuration from website settings
 */
export function getAiQuotaConfig(): AiQuotaConfig {
  const ws = WebsiteSettingsRepository.get();
  return {
    ...DEFAULT_AI_QUOTA_CONFIG,
    ...(ws.aiQuota || {}),
  };
}

/**
 * Determine if user is Owner
 */
export function isOwner(user: { role?: string } | null | undefined): boolean {
  return user?.role === "owner";
}

/**
 * Check if user is authorized to use AI
 * - Owner ALWAYS has access
 * - Other users require explicit Owner authorization (hasAiAccess === true)
 */
export function hasAiAccess(userOrId: User | string | null | undefined): boolean {
  if (!userOrId) return false;
  const user =
    typeof userOrId === "string"
      ? UserRepository.getById(userOrId)
      : UserRepository.getById(userOrId.id) || userOrId;
  if (!user) return false;
  if (isOwner(user)) return true;
  return Boolean(user.hasAiAccess);
}

/**
 * Get effective daily quota for a given user
 */
export function getUserEffectiveDailyQuota(
  userOrId: User | string,
  config: AiQuotaConfig = getAiQuotaConfig()
): number {
  const user =
    typeof userOrId === "string"
      ? UserRepository.getById(userOrId)
      : UserRepository.getById(userOrId.id) || userOrId;
  if (!user) return config.defaultUserDailyQuota || DEFAULT_AI_QUOTA_CONFIG.defaultUserDailyQuota;

  if (user.dailyAiQuotaOverride !== undefined && user.dailyAiQuotaOverride !== null && user.dailyAiQuotaOverride > 0) {
    return user.dailyAiQuotaOverride;
  }
  if (isOwner(user)) {
    return config.ownerDailyQuota || DEFAULT_AI_QUOTA_CONFIG.ownerDailyQuota;
  }
  return config.defaultUserDailyQuota || DEFAULT_AI_QUOTA_CONFIG.defaultUserDailyQuota;
}

export type ReservationResult =
  | {
      success: true;
      reservationId: string;
      quotaDate: string;
      remainingQuota: number;
    }
  | {
      success: false;
      statusCode: number;
      code: string;
      message: string;
      retryAfterSeconds?: number;
    };

/**
 * Atomically reserve AI quota for a generation request
 */
export function reserveAiQuota(userOrId: User | string, requestedQuestions: number): ReservationResult {
  const config = getAiQuotaConfig();
  const user =
    typeof userOrId === "string"
      ? UserRepository.getById(userOrId)
      : UserRepository.getById(userOrId.id) || userOrId;

  if (!user) {
    return {
      success: false,
      statusCode: 403,
      code: "UNAUTHORIZED_AI_ACCESS",
      message: "Akun Anda belum memiliki izin akses Generator AI.",
    };
  }

  // 1. Emergency shutdown check
  if (config.emergencyShutdown) {
    return {
      success: false,
      statusCode: 503,
      code: "EMERGENCY_SHUTDOWN",
      message: "Generator AI sedang dinonaktifkan sementara oleh Owner dalam mode darurat.",
    };
  }

  // 2. Global enable toggle check
  if (!config.enabled) {
    return {
      success: false,
      statusCode: 503,
      code: "AI_DISABLED",
      message: "Generator AI saat ini dinonaktifkan oleh administrator.",
    };
  }

  // 3. User AI Authorization check
  if (!hasAiAccess(user)) {
    return {
      success: false,
      statusCode: 403,
      code: "UNAUTHORIZED_AI_ACCESS",
      message: "Akun Anda belum memiliki izin akses Generator AI. Silakan hubungi Owner untuk memperoleh izin akses.",
    };
  }

  // 4. Maximum questions per request limit check
  const maxQuestions = config.maxQuestionsPerRequest || DEFAULT_AI_QUOTA_CONFIG.maxQuestionsPerRequest;
  if (requestedQuestions > maxQuestions) {
    return {
      success: false,
      statusCode: 400,
      code: "EXCEEDS_MAX_QUESTIONS",
      message: `Jumlah soal melebihi batas maksimum per permintaan (${maxQuestions} butir).`,
    };
  }

  // 5. Sliding-window rate limit (RPM)
  const rateLimit = checkRateLimit(user.id, config.rateLimitRpm || DEFAULT_AI_QUOTA_CONFIG.rateLimitRpm);
  if (!rateLimit.allowed) {
    return {
      success: false,
      statusCode: 429,
      code: "RATE_LIMIT_EXCEEDED",
      message: `Batas frekuensi permintaan terlampaui (${config.rateLimitRpm} request/menit). Silakan tunggu ${rateLimit.retryAfterSeconds} detik.`,
      retryAfterSeconds: rateLimit.retryAfterSeconds,
    };
  }

  const quotaDate = getJakartaDateString();

  // 6. Global daily limit check
  const todayRecords = UserQuotaRepository.getAllForDate(quotaDate);
  const globalRequestsUsed = todayRecords.reduce((sum, r) => sum + r.requestsUsed, 0);
  const globalRequestsReserved = todayRecords.reduce((sum, r) => sum + r.requestsReserved, 0);

  if (globalRequestsUsed + globalRequestsReserved >= config.globalDailyLimit) {
    return {
      success: false,
      statusCode: 429,
      code: "GLOBAL_QUOTA_EXHAUSTED",
      message: `Kuota harian global platform NemoLearn (${config.globalDailyLimit} generasi/hari) telah tercapai. Reset pada pukul 00:00 WIB.`,
    };
  }

  // 7. User daily quota check
  const effectiveQuota = getUserEffectiveDailyQuota(user, config);
  let record = UserQuotaRepository.get(user.id, quotaDate);
  if (!record) {
    record = {
      id: `quota_${user.id}_${quotaDate}`,
      userId: user.id,
      quotaDate,
      requestsUsed: 0,
      requestsReserved: 0,
      questionsGenerated: 0,
      tokensConsumed: 0,
      lastRequestAt: new Date().toISOString(),
    };
  }

  if (record.requestsUsed + record.requestsReserved >= effectiveQuota) {
    return {
      success: false,
      statusCode: 429,
      code: "USER_QUOTA_EXHAUSTED",
      message: `Kuota AI harian Anda (${effectiveQuota} kali) telah habis. Kuota akan diperbarui kembali pada pukul 00:00 WIB.`,
    };
  }

  // 8. Atomic Reservation increment
  const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  record.requestsReserved += 1;
  record.lastRequestAt = new Date().toISOString();
  UserQuotaRepository.upsert(record);

  activeReservations.set(reservationId, {
    id: reservationId,
    userId: user.id,
    quotaDate,
    requestedQuestions,
    createdAt: Date.now(),
  });

  const remaining = Math.max(0, effectiveQuota - (record.requestsUsed + record.requestsReserved));

  return {
    success: true,
    reservationId,
    quotaDate,
    remainingQuota: remaining,
  };
}

/**
 * Confirm reservation upon successful AI generation
 */
export function confirmAiQuota(params: {
  userId: string;
  reservationId: string;
  quotaDate?: string;
  questionsCount: number;
  tokensConsumed?: number;
}): void {
  const reservation = activeReservations.get(params.reservationId);
  const quotaDate = params.quotaDate || reservation?.quotaDate || getJakartaDateString();
  activeReservations.delete(params.reservationId);

  let record = UserQuotaRepository.get(params.userId, quotaDate);
  if (!record) {
    record = {
      id: `quota_${params.userId}_${quotaDate}`,
      userId: params.userId,
      quotaDate,
      requestsUsed: 0,
      requestsReserved: 0,
      questionsGenerated: 0,
      tokensConsumed: 0,
      lastRequestAt: new Date().toISOString(),
    };
  }

  record.requestsReserved = Math.max(0, record.requestsReserved - 1);
  record.requestsUsed += 1;
  record.questionsGenerated += params.questionsCount;
  record.tokensConsumed += params.tokensConsumed || 0;
  record.lastRequestAt = new Date().toISOString();

  UserQuotaRepository.upsert(record);
}

/**
 * Release / Refund quota reservation upon provider failure
 */
export function releaseAiQuota(params: {
  userId: string;
  reservationId: string;
  quotaDate?: string;
  reason?: string;
}): void {
  const reservation = activeReservations.get(params.reservationId);
  const quotaDate = params.quotaDate || reservation?.quotaDate || getJakartaDateString();
  activeReservations.delete(params.reservationId);

  const record = UserQuotaRepository.get(params.userId, quotaDate);
  if (record) {
    record.requestsReserved = Math.max(0, record.requestsReserved - 1);
    record.lastRequestAt = new Date().toISOString();
    UserQuotaRepository.upsert(record);
  }
}

/**
 * Get comprehensive quota status for a specific user
 */
export function getUserQuotaStatus(userOrId: User | string) {
  const user =
    typeof userOrId === "string"
      ? UserRepository.getById(userOrId)
      : UserRepository.getById(userOrId.id) || userOrId;

  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  const config = getAiQuotaConfig();
  const quotaDate = getJakartaDateString();
  const isOwnerUser = isOwner(user);
  const userHasAccess = hasAiAccess(user);
  const dailyQuota = getUserEffectiveDailyQuota(user, config);

  const record = UserQuotaRepository.get(user.id, quotaDate);
  const usedToday = record ? record.requestsUsed : 0;
  const reservedToday = record ? record.requestsReserved : 0;
  const remainingToday = Math.max(0, dailyQuota - (usedToday + reservedToday));

  return {
    hasAiAccess: userHasAccess,
    isOwner: isOwnerUser,
    dailyQuota,
    usedToday,
    reservedToday,
    remainingToday,
    quotaDate,
    resetTimeIso: getNextJakartaMidnightIso(),
    rateLimitRpm: config.rateLimitRpm || DEFAULT_AI_QUOTA_CONFIG.rateLimitRpm,
    maxQuestionsPerRequest: config.maxQuestionsPerRequest || DEFAULT_AI_QUOTA_CONFIG.maxQuestionsPerRequest,
    emergencyShutdown: config.emergencyShutdown,
    enabled: config.enabled,
  };
}

/**
 * Owner Dashboard AI Quota Overview
 */
export function getAdminAiQuotaOverview() {
  const config = getAiQuotaConfig();
  const quotaDate = getJakartaDateString();
  const resetTimeIso = getNextJakartaMidnightIso();

  const allRecords = UserQuotaRepository.getAllForDate(quotaDate);
  const totalRequestsUsed = allRecords.reduce((sum, r) => sum + r.requestsUsed, 0);
  const totalRequestsReserved = allRecords.reduce((sum, r) => sum + r.requestsReserved, 0);
  const totalQuestionsGenerated = allRecords.reduce((sum, r) => sum + r.questionsGenerated, 0);
  const totalTokensConsumed = allRecords.reduce((sum, r) => sum + r.tokensConsumed, 0);

  // List all users with their current AI authorization and quota stats
  const { users } = UserRepository.getAll({ limit: 500 });
  const userSummaries = users.map((u) => {
    const isOwnerUser = isOwner(u);
    const userHasAccess = hasAiAccess(u);
    const effectiveDailyQuota = getUserEffectiveDailyQuota(u, config);
    const userRecord = allRecords.find((r) => r.userId === u.id);
    const requestsUsed = userRecord ? userRecord.requestsUsed : 0;
    const requestsReserved = userRecord ? userRecord.requestsReserved : 0;
    const questionsGenerated = userRecord ? userRecord.questionsGenerated : 0;
    const remainingQuota = Math.max(0, effectiveDailyQuota - (requestsUsed + requestsReserved));

    return {
      userId: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      hasAiAccess: userHasAccess,
      isOwner: isOwnerUser,
      dailyAiQuotaOverride: u.dailyAiQuotaOverride || null,
      effectiveDailyQuota,
      requestsUsed,
      requestsReserved,
      questionsGenerated,
      remainingQuota,
      aiAccessGrantedBy: u.aiAccessGrantedBy || null,
      aiAccessGrantedAt: u.aiAccessGrantedAt || null,
      lastRequestAt: userRecord?.lastRequestAt || u.lastActiveAt || null,
    };
  });

  return {
    quotaDate,
    resetTimeIso,
    config,
    stats: {
      globalDailyLimit: config.globalDailyLimit,
      totalRequestsUsed,
      totalRequestsReserved,
      remainingGlobalRequests: Math.max(0, config.globalDailyLimit - (totalRequestsUsed + totalRequestsReserved)),
      totalQuestionsGenerated,
      totalTokensConsumed,
      activeAuthorizedUsersCount: userSummaries.filter((u) => u.hasAiAccess).length,
      totalUsersCount: users.length,
    },
    users: userSummaries,
  };
}

/**
 * Grant AI access to a target user (Owner only)
 */
export function grantUserAiAccess(targetUserId: string, actor: User): User {
  if (!isOwner(actor)) {
    throw new Error("FORBIDDEN: Hanya Owner yang berhak memberikan izin akses AI.");
  }
  if (actor.id === targetUserId) {
    throw new Error("INVALID_ACTION: Owner tidak dapat mengubah izin akses dirinya sendiri.");
  }

  const target = UserRepository.getById(targetUserId);
  if (!target) {
    throw new Error("NOT_FOUND: Pengguna tidak ditemukan.");
  }

  const updated = UserRepository.update(targetUserId, {
    hasAiAccess: true,
    aiAccessGrantedBy: actor.id,
    aiAccessGrantedAt: new Date().toISOString(),
  });

  SystemLogRepository.log({
    level: "info",
    action: "AI_ACCESS_GRANTED",
    actorId: actor.id,
    actorEmail: actor.email,
    targetType: "user",
    targetId: targetUserId,
    details: `Owner ${actor.email} memberikan akses AI kepada ${target.email} (${target.displayName}).`,
  });

  return updated!;
}

/**
 * Revoke AI access from a target user (Owner only)
 */
export function revokeUserAiAccess(targetUserId: string, actor: User): User {
  if (!isOwner(actor)) {
    throw new Error("FORBIDDEN: Hanya Owner yang berhak mencabut izin akses AI.");
  }
  if (actor.id === targetUserId) {
    throw new Error("INVALID_ACTION: Akses AI Owner tidak dapat dicabut.");
  }

  const target = UserRepository.getById(targetUserId);
  if (!target) {
    throw new Error("NOT_FOUND: Pengguna tidak ditemukan.");
  }
  if (target.role === "owner") {
    throw new Error("FORBIDDEN: Tidak dapat mencabut akses AI dari akun Owner.");
  }

  const updated = UserRepository.update(targetUserId, {
    hasAiAccess: false,
    aiAccessGrantedBy: undefined,
    aiAccessGrantedAt: undefined,
  });

  SystemLogRepository.log({
    level: "warn",
    action: "AI_ACCESS_REVOKED",
    actorId: actor.id,
    actorEmail: actor.email,
    targetType: "user",
    targetId: targetUserId,
    details: `Owner ${actor.email} mencabut akses AI dari ${target.email} (${target.displayName}).`,
  });

  return updated!;
}

/**
 * Set individual daily quota override for a user (Owner only)
 */
export function setUserQuotaOverride(
  targetUserId: string,
  quotaOverride: number | null,
  actor: User
): User {
  if (!isOwner(actor)) {
    throw new Error("FORBIDDEN: Hanya Owner yang berhak mengatur batas kuota individual.");
  }
  if (actor.id === targetUserId) {
    throw new Error("INVALID_ACTION: Pengguna tidak dapat mengubah batas kuota dirinya sendiri.");
  }

  const target = UserRepository.getById(targetUserId);
  if (!target) {
    throw new Error("NOT_FOUND: Pengguna tidak ditemukan.");
  }

  const validOverride =
    quotaOverride !== null && quotaOverride !== undefined && quotaOverride > 0
      ? Math.floor(quotaOverride)
      : undefined;

  const updated = UserRepository.update(targetUserId, {
    dailyAiQuotaOverride: validOverride,
  });

  SystemLogRepository.log({
    level: "info",
    action: "AI_QUOTA_OVERRIDE_UPDATED",
    actorId: actor.id,
    actorEmail: actor.email,
    targetType: "user",
    targetId: targetUserId,
    details: `Owner ${actor.email} mengubah kuota harian ${target.email} menjadi ${validOverride ?? "Default"}.`,
  });

  return updated!;
}

/**
 * Update global AI Quota Configuration (Owner only)
 */
export function updateAiQuotaSettings(
  updates: Partial<AiQuotaConfig>,
  actor: User
): AiQuotaConfig {
  if (!isOwner(actor)) {
    throw new Error("FORBIDDEN: Hanya Owner yang berhak mengubah konfigurasi kuota AI.");
  }

  const current = getAiQuotaConfig();
  const newConfig: AiQuotaConfig = {
    ...current,
    ...updates,
    timezone: "Asia/Jakarta", // strictly Asia/Jakarta
  };

  WebsiteSettingsRepository.update({ aiQuota: newConfig }, actor.email);

  SystemLogRepository.log({
    level: updates.emergencyShutdown ? "error" : "info",
    action: updates.emergencyShutdown ? "AI_EMERGENCY_SHUTDOWN" : "AI_QUOTA_CONFIG_UPDATED",
    actorId: actor.id,
    actorEmail: actor.email,
    targetType: "system_settings",
    targetId: "ai_quota",
    details: updates.emergencyShutdown
      ? `Owner ${actor.email} mengaktifkan Emergency AI Shutdown!`
      : `Owner ${actor.email} memperbarui konfigurasi kuota AI.`,
  });

  return newConfig;
}
