import type { ActionLink, ListQuery } from "./types";

export const API_BASE_URL = process.env.INTERNAL_API_URL 
  || process.env.NEXT_PUBLIC_API_URL 
  || "http://localhost:3001";

export interface BackendErrorBody {
  message?: string | string[];
}

/** Thrown for HTTP 403 so pages can render "no access" instead of an error. */
export class ForbiddenError extends Error {
  readonly status = 403;

  constructor(message?: string) {
    super(message ?? "You do not have access to this resource.");
    this.name = "ForbiddenError";
  }
}

export function isForbidden(error: unknown): boolean {
  return error instanceof ForbiddenError;
}

export function backendMessage(
  body: BackendErrorBody | null,
  fallback: string,
) {
  if (!body) return fallback;
  if (Array.isArray(body.message)) return body.message.join(", ");
  if (typeof body.message === "string" && body.message.length > 0) {
    return body.message;
  }
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
  fallback = "Request failed. Please try again.",
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let body: BackendErrorBody | null = null;
    try {
      body = (await res.json()) as BackendErrorBody;
    } catch {
      body = null;
    }
    if (res.status === 401) {
      throw new Error("Session expired. Please sign in again.");
    }
    if (res.status === 403) {
      throw new ForbiddenError(
        body && typeof body.message === "string" && body.message.length > 0
          ? body.message
          : undefined,
      );
    }
    throw new Error(backendMessage(body, fallback));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export function toQueryString(query: ListQuery): string {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.status) params.set("status", query.status);
  if (query.type) params.set("type", query.type);
  if (query.employee_id) params.set("employee_id", query.employee_id);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export interface DownloadedFile {
  blob: Blob;
  filename: string | null;
}

function filenameFromDisposition(value: string | null): string | null {
  if (!value) return null;
  const match = /filename="?([^";]+)"?/.exec(value);
  return match ? match[1] : null;
}

/** Download a binary response (Excel export) with auth handling. */
export async function apiDownload(
  path: string,
  token: string,
  fallback = "Request failed. Please try again.",
): Promise<DownloadedFile> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    let body: BackendErrorBody | null = null;
    try {
      body = (await res.json()) as BackendErrorBody;
    } catch {
      body = null;
    }
    if (res.status === 401) {
      throw new Error("Session expired. Please sign in again.");
    }
    if (res.status === 403) {
      throw new ForbiddenError(
        body && typeof body.message === "string" && body.message.length > 0
          ? body.message
          : undefined,
      );
    }
    throw new Error(backendMessage(body, fallback));
  }
  const blob = await res.blob();
  return {
    blob,
    filename: filenameFromDisposition(res.headers.get("content-disposition")),
  };
}

/** Trigger a browser download for a previously fetched blob. */
export function saveDownloadedFile(file: DownloadedFile, fallbackName: string) {
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename ?? fallbackName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function executeAction<T>(
  token: string,
  link: ActionLink,
  body?: unknown,
): Promise<T> {
  return apiFetch<T>(
    link.href,
    token,
    {
      method: link.method,
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    `Could not ${link.label.toLowerCase()}.`,
  );
}
