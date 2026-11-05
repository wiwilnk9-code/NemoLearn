export interface SessionResponseRecord {
  id?: string;
  sessionId?: string;
  questionId: string;
  selectedAnswer: "A" | "B" | "C" | "D" | "E" | null;
  isCorrect: boolean | null;
  answeredAt?: string;
  timeSpentSeconds?: number;
}

export interface SaveAnswerPayload {
  sessionId: string;
  questionId: string;
  selectedAnswer: "A" | "B" | "C" | "D" | "E" | null;
}
