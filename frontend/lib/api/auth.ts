import {
  API_BASE_URL,
  apiFetch,
  backendMessage,
  type BackendErrorBody,
} from "./client";
import type { EmployeeDetail } from "./employees";

export interface LoginEmployee {
  id: string;
  name: string;
  email: string;
}

// Response shapes mirror the backend snake_case wire format.
export interface LoginResponse {
  employee: LoginEmployee;
  token: string;
  expires_at: string;
  session_id: string;
}

export interface AuthSession {
  id: string;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  revoked_at: string | null;
  user_agent: string | null;
  ip_address: string | null;
  is_current: boolean;
}

const TOKEN_KEY = "hr.auth.token";
const EMPLOYEE_KEY = "hr.auth.employee";

export async function loginRequest(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let body: BackendErrorBody | null = null;
    try {
      body = (await res.json()) as BackendErrorBody;
    } catch {
      body = null;
    }
    if (res.status === 401) {
      throw new Error(backendMessage(body, "Invalid email or password."));
    }
    throw new Error(
      backendMessage(body, "Sign in failed. Please try again."),
    );
  }

  return (await res.json()) as LoginResponse;
}

export async function fetchCurrentEmployee(token: string) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Session expired. Please sign in again.");
  }
  return (await res.json()) as LoginEmployee;
}

export async function fetchCurrentEmployeeDetail(
  token: string,
): Promise<EmployeeDetail> {
  return apiFetch<EmployeeDetail>(
    "/auth/me",
    token,
    undefined,
    "Could not load your profile.",
  );
}

export async function listSessions(token: string): Promise<AuthSession[]> {
  return apiFetch<AuthSession[]>(
    "/auth/sessions",
    token,
    undefined,
    "Could not load sessions.",
  );
}

export async function revokeSession(
  token: string,
  sessionId: string,
): Promise<void> {
  await apiFetch<void>(
    `/auth/sessions/${sessionId}`,
    token,
    { method: "DELETE" },
    "Could not revoke the session.",
  );
}

export async function revokeOtherSessions(token: string): Promise<void> {
  await apiFetch<void>(
    "/auth/sessions",
    token,
    { method: "DELETE" },
    "Could not revoke other sessions.",
  );
}

export async function changePasswordRequest(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiFetch<void>(
    "/auth/change-password",
    token,
    {
      method: "POST",
      // Backend `ChangePasswordDto` exposes snake_case keys.
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    },
    "Could not change the password.",
  );
}

export async function logoutRequest(token: string) {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function saveAuthSession(data: LoginResponse) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(data.employee));
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmployee(): LoginEmployee | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(EMPLOYEE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LoginEmployee;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMPLOYEE_KEY);
}
