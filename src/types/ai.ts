import { PracticeMode, Question, ExplanationDepth } from "./question";

export type AIProviderType = "gemini" | "openai" | "openai-compatible" | "mock";

export interface QuestionGenRequest {
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  subtopic?: string;
  questionCount: number; // 1 to 30
  mode: PracticeMode;
  level?: "SMA";
  difficulty?: "mudah" | "sedang" | "sulit" | "hots";
  documentContext?: string;
  includeExplanation?: boolean;
  lazyExplanation?: boolean;
}

export interface ExplanationGenRequest {
  questionId: string;
  stem: string;
  options: { key: "A" | "B" | "C" | "D" | "E"; text: string }[];
  correctAnswer: "A" | "B" | "C" | "D" | "E";
  subjectId?: string;
  subjectName: string;
  topicName?: string;
  subtopic?: string;
  depth?: ExplanationDepth;
  isExactSubject?: boolean;
}

export interface RawAiQuestionOutput {
  stem: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  correctAnswer: "A" | "B" | "C" | "D" | "E";
  explanation?: string;
  hint?: string;
  difficulty?: "mudah" | "sedang" | "sulit" | "hots";
}

export type AIErrorCode =
  | "CONFIG_MISSING"
  | "INVALID_KEY"
  | "QUOTA_EXHAUSTED"
  | "MODEL_NOT_FOUND"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "SERVER_ERROR"
  | "EMPTY_RESPONSE"
  | "CONTENT_FILTERED"
  | "INVALID_FORMAT"
  | "SCHEMA_VALIDATION_FAILED"
  | "API_ERROR"
  | "INVALID_CONFIG"
  | "FORBIDDEN"
  | "UNKNOWN_ERROR";

export class AIError extends Error {
  code: AIErrorCode;
  statusCode: number;

  constructor(code: AIErrorCode, message: string, statusCode = 500) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface AITestResult {
  success: boolean;
  message: string;
  provider?: string;
  model?: string;
  latencyMs?: number;
  errorType?: AIErrorCode;
  statusCode?: number;
}

export interface AIProvider {
  name: string;
  providerType: AIProviderType;
  generateQuestions(req: QuestionGenRequest): Promise<Question[]>;
  generateExplanation?(req: ExplanationGenRequest): Promise<string>;
  testConnection(): Promise<AITestResult>;
}

export interface AISettings {
  provider: AIProviderType;
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs: number;
  updatedAt: string;
  updatedBy?: string;
  providerKeys?: Partial<Record<AIProviderType, string>>;
}
