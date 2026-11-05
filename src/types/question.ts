export interface QuestionOption {
  key: "A" | "B" | "C" | "D" | "E";
  text: string;
}

export type QuestionDifficulty = "mudah" | "sedang" | "sulit" | "hots";
export type PracticeMode = "reguler" | "hots" | "practice";
export type LearningMode = "belajar" | "ujian";
export type QuestionStatus = "draft" | "published";
export type QuestionGrade = "10" | "11" | "12" | "SMA";
export type QuestionSourceType = "ai" | "curated_bank" | "document_upload" | "manual" | "ai_generated";
export type ExplanationDepth = "singkat" | "normal" | "mendalam";

export interface QuestionExplanation {
  id: string; // exp_${questionId}_${depth}_v${version}
  questionId: string;
  version: number;
  depth: ExplanationDepth;
  content: string;
  provider?: string;
  model?: string;
  generatedAt: string;
  latencyMs?: number;
}

export interface IRTParameters {
  difficulty: number; // b parameter (tingkat kesulitan: -3.0 s.d +3.0)
  discrimination?: number; // a parameter (daya pembeda: 0.5 s.d 2.5)
  guessing?: number; // c parameter (tebakan semu: 0.0 s.d 0.25)
  isCalibrated?: boolean; // apakah terkalibrasi secara empiris dari respon riil
}

export interface Question {
  id: string;
  subjectId: string;
  subjectName?: string;
  topicId: string;
  topicName?: string;
  subtopic?: string;
  level: "SMA";
  grade?: QuestionGrade;
  type: "pilihan_ganda";
  stem: string; // The question text / problem statement (may contain LaTeX)
  options: QuestionOption[];
  correctAnswer: "A" | "B" | "C" | "D" | "E";
  explanation: string; // Step-by-step reasoning & concept review
  hint?: string; // Optional hint / petunjuk pengerjaan
  imageUrl?: string; // Optional illustration image URL or diagram
  isAiGenerated: boolean;
  difficulty: QuestionDifficulty;
  irt?: IRTParameters; // Optional Item Response Theory parameters
  sourceType: QuestionSourceType;
  sourceReference?: string;
  sourceId?: string;
  status?: QuestionStatus; // "draft" | "published" (defaults to "published")
  createdBy?: string; // userId of creator (teacher or admin)
  createdByName?: string; // cached display name of author
  version?: number; // Question version for explanation cache invalidation
  createdAt: string;
  updatedAt?: string;
}

/**
 * Public version of the question delivered to students during active practice.
 * CRITICAL SECURITY / INTEGRITY RULE (FR-06):
 * correctAnswer and explanation are omitted so students cannot inspect client state to cheat.
 */
export interface PublicQuestion {
  id: string;
  subjectId: string;
  topicId: string;
  subtopic?: string;
  level: "SMA";
  grade?: QuestionGrade;
  type: "pilihan_ganda";
  stem: string;
  options: QuestionOption[];
  difficulty: QuestionDifficulty;
  hint?: string;
  imageUrl?: string;
  isAiGenerated: boolean;
  sourceType?: QuestionSourceType;
}

export interface QuestionFilterOptions {
  subjectId?: string;
  topicId?: string;
  grade?: string;
  difficulty?: string;
  status?: QuestionStatus | "all";
  search?: string;
  createdBy?: string;
  mineOnly?: boolean;
  page?: number;
  limit?: number;
  includeDrafts?: boolean;
}

export interface QuestionStats {
  totalPublished: number;
  totalDraft: number;
  totalHots: number;
  myQuestionsCount: number;
}
