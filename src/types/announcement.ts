export type AnnouncementType = "info" | "warning" | "danger" | "maintenance";
export type AnnouncementTargetRole = "all" | "pelajar" | "guru" | "admin" | "owner";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  targetRole: AnnouncementTargetRole;
  isActive: boolean;
  validUntil?: string | null;
  createdAt: string;
  createdBy?: string | null;
  updatedAt?: string;
}
