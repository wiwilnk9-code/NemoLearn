import { UserRole } from "./user";

export type SystemLogCategory =
  | "auth"
  | "admin"
  | "user"
  | "ai"
  | "system"
  | "security"
  | "role_change"
  | "settings";

export type SystemLogStatus =
  | "SUKSES"
  | "GAGAL"
  | "PERINGATAN"
  | "BLOCKED"
  | "TERATASI"
  | "SECURITY";

export interface SystemLogPayload {
  mutationId?: string;
  endpoint?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  policyId?: string;
  userAgent?: string;
  extra?: Record<string, any>;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  createdAt?: string;
  level: "info" | "warn" | "error" | "security";
  category?: SystemLogCategory;
  action: string;
  actorId: string;
  actorEmail: string;
  actorName?: string;
  actorRole?: string;
  actorAvatar?: string;
  target?: string;
  targetType?: string;
  targetId?: string;
  details: string;
  ip?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  asn?: string;
  status?: SystemLogStatus;
  payload?: SystemLogPayload;
}

export type OperationalHealthStatus = "Healthy" | "Degraded" | "Unavailable" | "Unknown";

export interface SubsystemHealthInfo {
  name: string;
  status: OperationalHealthStatus;
  latencyMs?: number;
  message: string;
  lastCheckedAt: string;
}

export interface SystemHealthData {
  // Global & backward-compatible
  status: "healthy" | "warning" | "error";
  databaseStatus: "healthy" | "warning";
  databaseItemsCount: number;
  aiStatus: "ready" | "unconfigured" | "error";
  authStatus: "healthy";
  uptimeFormatted: string;
  lastCheckedAt: string;

  // Real Subsystem monitoring checks (Task 5 restoration)
  overallStatus: OperationalHealthStatus;
  database: SubsystemHealthInfo & {
    itemsCount: number;
    fileStore: string;
    isSyncWithDisk: boolean;
  };
  aiProvider: SubsystemHealthInfo & {
    provider: string;
    model: string;
    hasKey: boolean;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    errorRate: number;
    avgLatencyMs?: number;
    lastError?: string;
  };
  apiServer: SubsystemHealthInfo & {
    uptimeSeconds: number;
    uptimeFormatted: string;
    memoryUsageMb: number;
    errorLogsCount24h: number;
  };
  recentErrors: Array<{
    timestamp: string;
    source: "AI_PROVIDER" | "DATABASE" | "AUTH" | "SYSTEM";
    message: string;
    model?: string;
    provider?: string;
  }>;
  recentAIRequests: Array<{
    timestamp: string;
    provider: string;
    model: string;
    success: boolean;
    latencyMs?: number;
    error?: string;
    subject?: string;
    topic?: string;
    status?: "SUCCESS" | "PARTIAL" | "FAILED" | "FALLBACK";
  }>;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    newUsers: number;
    pendingVerification?: number;
    byRole: Record<UserRole, number>;
  };
  questions: {
    total: number;
    published: number;
    draft: number;
    hots: number;
    curated: number;
    manual: number;
  };
  sessions: {
    total: number;
    completed: number;
    abandoned: number;
    active: number;
    irtCount: number;
    percentageCount: number;
    avgScoreFormatted: string;
    avgScoreNumeric: number;
    avgDurationSeconds?: number;
  };
  ai: {
    provider: string;
    model: string;
    hasKey: boolean;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    lastUsedAt?: string;
    errorRate: number;
    avgLatencyMs?: number;
  };
  trends: Array<{
    date: string;
    label: string;
    sessionsCount: number;
    questionsCount: number;
    aiRequestsCount: number;
  }>;
  systemHealth: SystemHealthData;
  recentSessions: Array<{
    id: string;
    userId: string;
    userName: string;
    subjectName: string;
    topicId: string;
    status: string;
    scoreFormatted?: string | null;
    scoringMethod?: string | null;
    completedAt?: string;
    startedAt: string;
  }>;
  recentLogs: SystemLog[];
  pendingReportsCount: number;
  analytics?: FullAdminAnalytics;
}

export interface UserFilterOptions {
  search?: string;
  role?: UserRole | "all";
  status?: "active" | "suspended" | "all";
  verificationStatus?: "unverified" | "pending" | "verified" | "rejected" | "all";
  dateRange?: "all" | "7d" | "30d" | "90d" | "1y" | string;
  page?: number;
  limit?: number;
}

export interface UserLearningStats {
  totalSessions: number;
  completedSessions: number;
  avgScoreFormatted: string;
  lastActiveAt?: string;
  recentSessions: Array<{
    id: string;
    subjectName: string;
    startedAt: string;
    status: string;
    scoreFormatted?: string | null;
  }>;
}

export interface AdminSessionFilterOptions {
  search?: string;
  status?: "active" | "completed" | "abandoned" | "all";
  scoringMethod?: "irt" | "percentage" | "all";
  subjectId?: string;
  page?: number;
  limit?: number;
}

export interface QuestionIssueReport {
  id: string;
  actorId: string;
  targetType?: string;
  targetId?: string;
  action?: string;
  reason?: string;
  status: "pending" | "resolved";
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  // Extended / Supabase schema mapping properties
  questionId?: string;
  reporterId?: string;
  reporterEmail?: string;
  reporterName?: string;
  issueType?: string;
  description?: string;
  adminNotes?: string;
}

export interface ReportFilterOptions {
  status?: "pending" | "resolved" | "all";
  page?: number;
  limit?: number;
}

export interface SystemLogFilterOptions {
  level?: "info" | "warn" | "error" | "security" | "all";
  category?: string;
  action?: string;
  search?: string;
  dateRange?: "24h" | "7d" | "30d" | "all";
  status?: string;
  page?: number;
  limit?: number;
}

export interface SystemLogMetricsSummary {
  totalToday: number;
  totalTodayTrendPct: number;
  failedLoginsToday: number;
  autoBlockedIpsCount: number;
  roleMutationsToday: number;
  roleMutations2FaPassed: boolean;
  systemErrorsToday: number;
  systemErrorsResolved: number;
  retentionDays: number;
  immutableLedgerId: string;
}

// ==========================================
// DYNAMIC ANALYTICS & DATABASE CHARTS (TASK 6)
// ==========================================

export interface UserGrowthPoint {
  date: string;
  label: string;
  newUsers: number;
  cumulativeUsers: number;
}

export interface PlatformActivityPoint {
  date: string;
  label: string;
  startedSessions: number;
  completedSessions: number;
  activeUsers: number;
}

export interface AIUsagePoint {
  date: string;
  label: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
}

export interface QuestionBankAnalytics {
  bySubject: Array<{
    subjectId: string;
    subjectName: string;
    total: number;
    hotsCount: number;
    percentage: number;
  }>;
  byTopic: Array<{
    topicId: string;
    topicName: string;
    subjectName: string;
    total: number;
  }>;
  byDifficulty: Array<{
    difficulty: "mudah" | "sedang" | "sulit" | "hots";
    label: string;
    count: number;
    percentage: number;
  }>;
  bySourceType: Array<{
    sourceType: "curated_bank" | "ai_generated" | "manual";
    label: string;
    count: number;
    percentage: number;
  }>;
  hotsProportion: {
    hots: number;
    reguler: number;
    total: number;
    hotsPercentage: number;
  };
}

export interface ScoreDistributionAnalytics {
  irt3pl: {
    totalSessions: number;
    avgScoreFormatted: string;
    avgScoreNumeric: number;
    minScore: number | null;
    maxScore: number | null;
    ranges: Array<{
      range: string;
      label: string;
      count: number;
      percentage: number;
    }>;
    dailyTrend: Array<{
      date: string;
      label: string;
      avgScore: number | null;
      sessionsCount: number;
    }>;
  };
  fallbackPercentage: {
    totalSessions: number;
    avgScoreFormatted: string;
    avgScoreNumeric: number;
    minScore: number | null;
    maxScore: number | null;
    ranges: Array<{
      range: string;
      label: string;
      count: number;
      percentage: number;
    }>;
    dailyTrend: Array<{
      date: string;
      label: string;
      avgScore: number | null;
      sessionsCount: number;
    }>;
  };
  completionStats: {
    total: number;
    completed: number;
    abandoned: number;
    inProgress: number;
    completionRate: number;
  };
}

export interface AIProviderAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  avgLatencyMs: number;
  byProvider: Array<{
    provider: string;
    count: number;
    percentage: number;
  }>;
  byModel: Array<{
    model: string;
    provider: string;
    count: number;
    percentage: number;
  }>;
  dailyTrend: AIUsagePoint[];
}

export interface FullAdminAnalytics {
  selectedDays: number;
  generatedAt: string;
  userGrowth: {
    trend: UserGrowthPoint[];
    totalNewInPeriod: number;
    totalUsersOverall: number;
  };
  platformActivity: {
    trend: PlatformActivityPoint[];
    totalStartedInPeriod: number;
    totalCompletedInPeriod: number;
    completionRateInPeriod: number;
  };
  aiAnalytics: AIProviderAnalytics;
  questionBank: QuestionBankAnalytics;
  scoreAnalytics: ScoreDistributionAnalytics;
}
