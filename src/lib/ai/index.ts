import { AIProvider, AISettings, AIProviderType } from "@/types/ai";
import { GeminiAIProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { OpenRouterProvider } from "./openrouter";
import { MockAIProvider } from "./mock";
import { AISettingsRepository } from "@/lib/db";

export function getActiveAISettings(): {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs: number;
  source: "database" | "env" | "default";
  updatedAt?: string;
  updatedBy?: string;
} {
  const dbSettings = AISettingsRepository.get();

  // 1. Prioritas Utama: Konfigurasi yang telah disetujui & disimpan oleh Admin di Database
  if (dbSettings) {
    const provider = dbSettings.provider || "mock";
    // Check if key exists in dbSettings, or in dbSettings.providerKeys, or in .env for this provider
    const storedKey =
      dbSettings.apiKey ||
      dbSettings.providerKeys?.[provider] ||
      getEnvApiKey(provider) ||
      "";

    return {
      provider,
      apiKey: storedKey,
      model: dbSettings.model || getDefaultModel(provider),
      baseUrl: dbSettings.baseUrl || getDefaultBaseUrl(provider),
      timeoutMs: dbSettings.timeoutMs || Number(process.env.AI_TIMEOUT_MS) || 20000,
      source: "database",
      updatedAt: dbSettings.updatedAt,
      updatedBy: dbSettings.updatedBy,
    };
  }

  // 2. Prioritas Kedua: Environment Variables Server (.env / server runtime)
  const envProviderRaw = (process.env.AI_PROVIDER || "").toLowerCase();
  let envProvider: AIProviderType = "mock";

  if (envProviderRaw === "gemini") {
    envProvider = "gemini";
  } else if (envProviderRaw === "openai") {
    envProvider = "openai";
  } else if (envProviderRaw === "openrouter") {
    envProvider = "openrouter";
  } else if (envProviderRaw === "openai-compatible" || envProviderRaw === "groq") {
    envProvider = "openai-compatible";
  } else if (process.env.OPENROUTER_API_KEY) {
    envProvider = "openrouter";
  } else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    envProvider = "gemini";
  } else if (process.env.OPENAI_API_KEY) {
    envProvider = "openai";
  }

  const envKey = getEnvApiKey(envProvider);

  let envModel = getDefaultModel(envProvider);
  if (envProvider === "gemini") {
    envModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  } else if (envProvider === "openrouter") {
    envModel = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct";
  } else if (envProvider === "openai" || envProvider === "openai-compatible") {
    envModel = process.env.OPENAI_MODEL || (envProvider === "openai" ? "gpt-4o-mini" : "llama-3.3-70b-versatile");
  }

  const envBaseUrl =
    envProvider === "openrouter"
      ? process.env.OPENROUTER_BASE_URL || getDefaultBaseUrl(envProvider)
      : envProvider === "openai-compatible" || envProvider === "openai"
      ? process.env.OPENAI_BASE_URL || getDefaultBaseUrl(envProvider)
      : undefined;

  const envTimeout = Number(process.env.AI_TIMEOUT_MS) || 20000;

  return {
    provider: envProvider,
    apiKey: envKey,
    model: envModel,
    baseUrl: envBaseUrl,
    timeoutMs: envTimeout,
    source: envKey || process.env.AI_PROVIDER ? "env" : "default",
  };
}

export function getEnvApiKey(provider: AIProviderType): string {
  if (provider === "gemini") {
    return (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  }
  if (provider === "openai") {
    return (process.env.OPENAI_API_KEY || "").trim();
  }
  if (provider === "openrouter") {
    return (process.env.OPENROUTER_API_KEY || "").trim();
  }
  if (provider === "openai-compatible") {
    return (
      process.env.OPENAI_API_KEY ||
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      ""
    ).trim();
  }
  return "";
}

export function getDefaultModel(provider: AIProviderType): string {
  switch (provider) {
    case "gemini":
      return "gemini-1.5-flash";
    case "openai":
      return "gpt-4o-mini";
    case "openrouter":
      return "meta-llama/llama-3.3-70b-instruct";
    case "openai-compatible":
      return "llama-3.3-70b-versatile";
    default:
      return "curated-sma-bank-v1";
  }
}

export function getDefaultBaseUrl(provider: AIProviderType): string | undefined {
  if (provider === "openai") return "https://api.openai.com/v1";
  if (provider === "openrouter") return "https://openrouter.ai/api/v1";
  if (provider === "openai-compatible") return "https://api.groq.com/openai/v1";
  return undefined;
}

export function maskApiKey(key?: string): string {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return "";
  }
  const clean = key.trim();
  if (clean.length <= 8) {
    return "••••••••";
  }
  return `${clean.substring(0, 7)}••••${clean.substring(clean.length - 4)}`;
}

export function getAIProvider(override?: Partial<AISettings>): AIProvider {
  const active = getActiveAISettings();

  const providerType = (override?.provider || active.provider || "mock") as AIProviderType;
  const apiKey = override?.apiKey !== undefined ? override.apiKey : active.apiKey;
  const model = override?.model || active.model;
  const baseUrl = override?.baseUrl !== undefined ? override.baseUrl : active.baseUrl;
  const timeoutMs = override?.timeoutMs || active.timeoutMs;

  switch (providerType) {
    case "gemini":
      return new GeminiAIProvider(apiKey, model, timeoutMs);
    case "openai":
      return new OpenAIProvider(apiKey, model, baseUrl, timeoutMs, "openai");
    case "openrouter":
      return new OpenRouterProvider(apiKey, model, baseUrl, timeoutMs);
    case "openai-compatible":
      return new OpenAIProvider(apiKey, model, baseUrl, timeoutMs, "openai-compatible");
    case "mock":
    default:
      return new MockAIProvider();
  }
}
