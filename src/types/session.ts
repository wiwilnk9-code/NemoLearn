import { PracticeMode, LearningMode, PublicQuestion, Question, QuestionDifficulty } from "./question";

export interface PracticeSessionConfig {
  subjectId: string;
  topicId: string;
  subtopic?: string;
  questionCount?: number; // 1 - 30
  totalQuestions?: number;
  difficulty?: QuestionDifficulty | string;
  mode: PracticeMode;
  learningMode?: LearningMode; // "belajar" (evaluasi instan per butir) vs "ujian" (evaluasi akhir)
  isRemedial?: boolean;
  parentSessionId?: string;
}

export type SessionStatus = "active" | "completed" | "abandoned" | "in_progress";
export type ScoringMethod = "irt" | "percentage" | "irt_3pl" | "percentage_fallback";
export type ScoringScale = "200-1000" | "0-100";

export interface ScoringDetail {
  method: ScoringMethod;
  scale: ScoringScale;
  version: string; // e.g. "v2.0-irt" or "v1.0-percentage"
  label: string; // "Skor IRT" or "Skor Latihan (Persentase)"
  rawPercentage: number; // 0.00 - 100.00
  scoreValue: number; // numeric score (200.00 - 1000.00 for IRT, 0.00 - 100.00 for percentage)
  formattedScore: string; // exact two decimals Indonesian format, e.g. "76,25" or "654,32"
  theta?: number; // latent trait ability theta if IRT
  standardError?: number; // standard error of estimation if IRT
  isIrtEligible: boolean; // whether session met IRT validity prerequisites
  scoringNotes: string; // transparent explanation of scoring model & fallback rationale
  notes?: string;
}

export interface PracticeSession {
  id: string;
  userId: string;
  userName?: string;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  config: PracticeSessionConfig;
  status: SessionStatus;
  questionIds: string[];
  score: number | null; // numeric score value (e.g. 76.25 or 654.32)
  scoreFormatted?: string | null; // e.g. "76,25" or "654,32"
  scoringMethod?: ScoringMethod | null;
  scoringScale?: ScoringScale | null;
  scoringVersion?: string | null;
  scoreLabel?: string | null;
  theta?: number | null;
  standardError?: number | null;
  correctCount?: number | null;
  wrongCount?: number | null;
  emptyCount?: number | null;
  startedAt: string;
  completedAt?: string;
}

export interface QuestionResultItem {
  questionNumber: number;
  question: Question;
  selectedAnswer: "A" | "B" | "C" | "D" | "E" | null;
  correctAnswer: "A" | "B" | "C" | "D" | "E";
  isCorrect: boolean;
  status: "correct" | "wrong" | "empty";
  explanation: string;
}

export interface PracticeSessionResult {
  session: PracticeSession;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
  scorePercentage: number; // preserved for backward-compatibility
  scoreDetail: ScoringDetail;
  items: QuestionResultItem[];
  weakTopics: {
    topicId: string;
    topicName: string;
    subtopic?: string;
    wrongCount: number;
  }[];
}
