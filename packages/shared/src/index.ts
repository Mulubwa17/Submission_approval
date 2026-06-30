export const roles = ["APPLICANT", "REVIEWER"] as const;
export type Role = (typeof roles)[number];

export const applicationStatuses = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "RETURNED"
] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];

export const applicationCategories = [
  "PROCUREMENT",
  "TRAVEL",
  "FINANCE",
  "HR",
  "OTHER"
] as const;
export type ApplicationCategory = (typeof applicationCategories)[number];

export type ApplicationSummary = {
  id: string;
  title: string;
  category: ApplicationCategory;
  status: ApplicationStatus;
  amount: number | null;
  createdAt: string;
  updatedAt: string;
};

export type AuditLogEntry = {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  comment: string | null;
  createdAt: string;
  actor: {
    name: string;
    email: string;
    role: Role;
  };
};
