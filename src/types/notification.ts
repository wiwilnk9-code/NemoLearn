export type NotificationType = "system" | "practice" | "report" | "badge" | "announcement";

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string | null;
  link?: string | null;
  createdAt: string;
}
