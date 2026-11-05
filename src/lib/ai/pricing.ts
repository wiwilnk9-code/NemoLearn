/**
 * NemoLearn AI Pricing and Token Economics Utility
 * Berdasarkan tarif resmi provider AI per 1M tokens (per 1,000,000 tokens)
 * Digunakan untuk menghitung estimasi biaya komputasi AI secara transparan dan akurat.
 */

export interface ModelPricing {
  providerName: string;
  promptPricePerMillion: number; // USD per 1,000,000 input tokens
  completionPricePerMillion: number; // USD per 1,000,000 output tokens
  purpose: string;
}

export const OFFICIAL_MODEL_PRICING: Record<string, ModelPricing> = {
  // Google Gemini Models
  "gemini-1.5-flash": {
    providerName: "Google Gemini",
    promptPricePerMillion: 0.075,
    completionPricePerMillion: 0.3,
    purpose: "Generasi Soal Cepat & Chat Tutor Interaktif",
  },
  "gemini-1.5-pro": {
    providerName: "Google Gemini",
    promptPricePerMillion: 3.5,
    completionPricePerMillion: 10.5,
    purpose: "Analisis Mendalam & Penalaran HOTS Kompleks",
  },
  "gemini-2.0-flash": {
    providerName: "Google Gemini",
    promptPricePerMillion: 0.1,
    completionPricePerMillion: 0.4,
    purpose: "Next-gen Reasoning & Multimodal",
  },

  // OpenAI Models
  "gpt-4o-mini": {
    providerName: "OpenAI",
    promptPricePerMillion: 0.15,
    completionPricePerMillion: 0.6,
    purpose: "Soal Latihan, Flashcards & Pembahasan Cepat",
  },
  "gpt-4o": {
    providerName: "OpenAI",
    promptPricePerMillion: 2.5,
    completionPricePerMillion: 10.0,
    purpose: "Olimpiade Sains & Kurikulum Lanjutan",
  },

  // Groq / OpenRouter / Anthropic Open-source Models
  "llama-3.3-70b-versatile": {
    providerName: "OpenAI-Compatible (Groq)",
    promptPricePerMillion: 0.59,
    completionPricePerMillion: 0.79,
    purpose: "High-throughput Ultra-low Latency Inference",
  },
  "llama-3.1-8b-instant": {
    providerName: "OpenAI-Compatible (Groq)",
    promptPricePerMillion: 0.05,
    completionPricePerMillion: 0.08,
    purpose: "Instant Classification & Token Verification",
  },
  "claude-3-5-sonnet": {
    providerName: "OpenAI-Compatible (OpenRouter)",
    promptPricePerMillion: 3.0,
    completionPricePerMillion: 15.0,
    purpose: "Evaluasi Esai & Analitik Kualitatif",
  },

  // Nemo Offline Curated Fallback
  "curated-sma-bank-v1": {
    providerName: "Nemo Local Engine",
    promptPricePerMillion: 0.0,
    completionPricePerMillion: 0.0,
    purpose: "Emergency Fallback & Local Bank Soal (Free)",
  },
  mock: {
    providerName: "Nemo Local Engine",
    promptPricePerMillion: 0.0,
    completionPricePerMillion: 0.0,
    purpose: "Emergency Fallback & Local Bank Soal (Free)",
  },
};

/**
 * Normalisasi nama model untuk mencocokkan pricing catalog
 */
export function getModelPricing(modelName?: string): ModelPricing {
  if (!modelName) {
    return OFFICIAL_MODEL_PRICING["gemini-1.5-flash"];
  }

  const clean = modelName.toLowerCase().trim();

  for (const [key, pricing] of Object.entries(OFFICIAL_MODEL_PRICING)) {
    if (clean === key || clean.includes(key)) {
      return pricing;
    }
  }

  // Fallback heuristics
  if (clean.includes("gemini") && clean.includes("pro")) {
    return OFFICIAL_MODEL_PRICING["gemini-1.5-pro"];
  }
  if (clean.includes("gemini")) {
    return OFFICIAL_MODEL_PRICING["gemini-1.5-flash"];
  }
  if (clean.includes("gpt-4o-mini")) {
    return OFFICIAL_MODEL_PRICING["gpt-4o-mini"];
  }
  if (clean.includes("gpt-4")) {
    return OFFICIAL_MODEL_PRICING["gpt-4o"];
  }
  if (clean.includes("claude")) {
    return OFFICIAL_MODEL_PRICING["claude-3-5-sonnet"];
  }
  if (clean.includes("llama")) {
    return OFFICIAL_MODEL_PRICING["llama-3.3-70b-versatile"];
  }
  if (clean.includes("mock") || clean.includes("bank") || clean.includes("curated")) {
    return OFFICIAL_MODEL_PRICING["curated-sma-bank-v1"];
  }

  // Default ke rate hemat gemini 1.5 flash
  return {
    providerName: "Custom AI Provider",
    promptPricePerMillion: 0.15,
    completionPricePerMillion: 0.6,
    purpose: "General Purpose Inference",
  };
}

/**
 * Hitung estimasi biaya komputasi AI dalam USD ($)
 */
export function calculateEstimatedCost(
  modelName: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = getModelPricing(modelName);
  const promptCost = (promptTokens / 1_000_000) * pricing.promptPricePerMillion;
  const completionCost = (completionTokens / 1_000_000) * pricing.completionPricePerMillion;
  return Number((promptCost + completionCost).toFixed(6));
}

/**
 * Estimasi jumlah token jika provider tidak mengembalikan data usage metadata (transparan)
 */
export function estimateTokensFromRequest(params: {
  requestType?: "question_generation" | "explanation_generation";
  questionCount?: number;
  depth?: string;
  hasError?: boolean;
}): { promptTokens: number; completionTokens: number; totalTokens: number; isEstimated: boolean } {
  if (params.requestType === "explanation_generation") {
    const promptTokens = 380;
    const completionTokens = params.hasError ? 0 : params.depth === "mendalam" ? 650 : 320;
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      isEstimated: true,
    };
  }

  // question_generation
  const count = params.questionCount || 5;
  const promptTokens = 420 + count * 60;
  const completionTokens = params.hasError ? 0 : count * 340;
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    isEstimated: true,
  };
}

/**
 * Format jumlah token menjadi teks yang mudah dibaca (misal 14.8M, 512K, atau 1,240)
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)} M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)} K`;
  }
  return tokens.toLocaleString();
}

/**
 * Format biaya ke format USD ($)
 */
export function formatCurrencyUsd(amount: number): string {
  if (amount < 0.01 && amount > 0) {
    return `$${amount.toFixed(4)}`;
  }
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
