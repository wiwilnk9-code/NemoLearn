export type FeedbackType = "feedback" | "bug_report" | "contact_support";

export type FeedbackStatus = "new" | "in_progress" | "resolved" | "closed";

export interface UserFeedback {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  type: FeedbackType;
  category?: string; // e.g. "soal", "ai_generator", "ui_ux", "akun", "lainnya"
  subject: string;
  message: string;
  rating?: number; // 1-5 for feedback
  deviceInfo?: string;
  status: FeedbackStatus;
  adminResponse?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface FeedbackFilterOptions {
  type?: FeedbackType;
  status?: FeedbackStatus;
  search?: string;
  page?: number;
  limit?: number;
}
