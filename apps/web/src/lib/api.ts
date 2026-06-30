import type {
  ApplicationCategory,
  ApplicationStatus,
  AuditLogEntry,
  Role
} from "@submission/shared";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type ApiApplication = {
  id: string;
  ownerId: string;
  title: string;
  category: ApplicationCategory;
  description: string | null;
  amount: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id?: string;
    name: string;
    email: string;
  };
  auditLogs?: AuditLogEntry[];
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type ApplicationPayload = {
  title: string;
  category: ApplicationCategory;
  description?: string;
  amount?: string;
};

type ApiErrorBody = {
  code?: string;
  message?: string | string[];
};

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  if (!response.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }

    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message ?? `Request failed with ${response.status}`;

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function createApplication(payload: ApplicationPayload) {
  return apiFetch<ApiApplication>("/applications", {
    body: JSON.stringify(payload),
    method: "POST"
  });
}

export function updateApplication(id: string, payload: ApplicationPayload) {
  return apiFetch<ApiApplication>(`/applications/${id}`, {
    body: JSON.stringify(payload),
    method: "PATCH"
  });
}

export function transitionApplication(
  path: string,
  comment?: string
) {
  return apiFetch<ApiApplication>(path, {
    body: JSON.stringify({ comment }),
    method: "POST"
  });
}
