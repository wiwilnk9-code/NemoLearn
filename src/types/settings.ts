export type MaintenanceScope = "all" | "ai-only";
export type BroadcastCategory = "info" | "success" | "warning" | "critical";
export type BroadcastAudience = "all" | "teachers" | "students";

export interface AppInfoConfig {
  version: string;
  buildNumber: string;
  clusterId: string;
  region: string;
  environment: string;
  nodeVersion?: string;
}

export interface MaintenanceConfig {
  enabled: boolean;
  scope: MaintenanceScope;
  message: string;
  estimatedEndTime: string;
  bypassIpWhitelist: string[];
}

export interface BroadcastConfig {
  active: boolean;
  message: string;
  category: BroadcastCategory;
  audience: BroadcastAudience;
  expiresAt: string;
  updatedAt?: string;
}

export interface FreeTierRateLimit {
  dailyPromptLimit: number;
  weeklyQuizLimit: number;
  cooldownSeconds: number;
  activeAccountsCount?: number;
}

export interface ProTierRateLimit {
  burstLimitPerMinute: number;
  autoBurstQueueing: boolean;
  fairUsagePolicy: boolean;
}

export interface EnterpriseTierRateLimit {
  batchQuizLimit: number;
  maxUploadMb: number;
  vipClusterQos: boolean;
}

export interface RateLimitsConfig {
  freeTier: FreeTierRateLimit;
  proTier: ProTierRateLimit;
  enterpriseTier: EnterpriseTierRateLimit;
}

export interface AiRoutingConfig {
  primaryModel: string;
  primaryProvider: string;
  fallbackAutoSwitch: boolean;
  fallbackModel: string;
  tutorTemperature: number;
  examTemperature: number;
  timeoutMs: number;
}

export interface AiQuotaConfig {
  enabled: boolean;
  emergencyShutdown: boolean;
  ownerDailyQuota: number;
  defaultUserDailyQuota: number;
  globalDailyLimit: number;
  globalDailyQuestionsLimit?: number;
  rateLimitRpm: number;
  maxQuestionsPerRequest: number;
  timezone: string;
}

export interface SecurityGovernanceConfig {
  sessionLifetimeDays: number;
  superadminMfaEnforced: boolean;
  wafShieldActive: boolean;
  dataRetentionDays: number;
  hardwareTokenAllowed: boolean;
}

export interface WebsiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  curriculum: string;
  logoUrl?: string;
  enableAIGenerator: boolean;
  enableIRTScoring: boolean;
  enablePdfExport: boolean;
  maintenanceMode: boolean;
  allowPublicRegistration: boolean;
  appInfo: AppInfoConfig;
  maintenance: MaintenanceConfig;
  broadcast: BroadcastConfig;
  rateLimits: RateLimitsConfig;
  aiRouting: AiRoutingConfig;
  aiQuota?: AiQuotaConfig;
  security: SecurityGovernanceConfig;
  updatedAt?: string;
  updatedBy?: string;
}

export interface MaskedApiVaultItem {
  id: string;
  provider: "openai" | "anthropic" | "gemini" | "openrouter" | "mock";
  name: string;
  model: string;
  isSet: boolean;
  maskedKey: string;
  lastRotatedText: string;
  status: "optimal" | "ready" | "unconfigured";
  avgLatencyMs: number;
  uptime: string;
  badgeText: string;
}

export interface GovernanceLogItem {
  id: string;
  timestamp: string;
  operator: string;
  activity: string;
  status: "SUCCESS" | "REDIRECTED" | "APPLIED" | "FAILED" | "SECURITY";
  category: "SETTINGS" | "KEY_ROTATION" | "FAILOVER" | "RATE_LIMIT" | "MAINTENANCE" | "BROADCAST";
}
