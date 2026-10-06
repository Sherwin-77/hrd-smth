export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface LoginEmployee {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  employee: LoginEmployee;
  token: string;
  expiresAt: string;
  sessionId: string;
}

const TOKEN_KEY = "hr.auth.token";
const EMPLOYEE_KEY = "hr.auth.employee";

interface BackendErrorBody {
  message?: string | string[];
}

function backendMessage(body: BackendErrorBody | null, fallback: string) {
  if (!body) return fallback;
  if (Array.isArray(body.message)) return body.message.join(", ");
  if (typeof body.message === "string" && body.message.length > 0) {
    return body.message;
  }
  return fallback;
}

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
