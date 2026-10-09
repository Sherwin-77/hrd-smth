export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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

export interface PayrollSummary {
  id: string;
  employee_id: string;
  account_number: string;
  account_name: string;
  tax_percentage: number;
  status: string;
  created_at: string;
  updated_at: string;
  available_actions: ActionLink[];
}

export interface PayslipSummary {
  id: string;
  employee_id: string;
  payroll_id: string;
  basic_salary: number;
  overtime: number;
  tax: number;
  bonus: number;
  deduction: number;
  total: number;
  date: string;
  status: string;
  created_at: string;
  updated_at: string;
  available_actions: ActionLink[];
}

export interface EmployeeDetail {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  sex: string;
  birth_date: string;
  join_at: string;
  leave_at: string | null;
  created_at: string;
  updated_at: string;
  active_payroll: PayrollSummary | null;
  payslips: PayslipSummary[];
}

export interface EmployeeIndex {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  sex: string;
  birth_date: string;
  join_at: string;
  leave_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
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

async function apiFetch<T>(
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
    throw new Error(backendMessage(body, fallback));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
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

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

function toQueryString(query: ListQuery): string {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.status) params.set("status", query.status);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export async function listEmployees(
  token: string,
  query: ListQuery,
): Promise<Paginated<EmployeeIndex>> {
  return apiFetch<Paginated<EmployeeIndex>>(
    `/employees${toQueryString(query)}`,
    token,
    undefined,
    "Could not load employees.",
  );
}

export async function listPayrolls(
  token: string,
  query: ListQuery,
): Promise<Paginated<PayrollSummary>> {
  return apiFetch<Paginated<PayrollSummary>>(
    `/payrolls${toQueryString(query)}`,
    token,
    undefined,
    "Could not load payrolls.",
  );
}

export async function listPayslips(
  token: string,
  query: ListQuery,
): Promise<Paginated<PayslipSummary>> {
  return apiFetch<Paginated<PayslipSummary>>(
    `/payslips${toQueryString(query)}`,
    token,
    undefined,
    "Could not load payslips.",
  );
}

// Enum options mirror the backend EnumResourceDto wire format
// ({ label, value }). The backend is the source of truth; no
// hardcoded enum values live on this side.
// Action links mirror the backend ActionLinkDto wire format
// ({ id, method, href, label, requires_input }). The backend owns
// visibility and URLs; the frontend renders them generically.
export interface ActionLink {
  id: string;
  method: "PATCH" | "DELETE";
  href: string;
  label: string;
  requires_input?: string;
}

export interface EnumOption {
  label: string;
  value: string;
}

export async function listEmployeeSexes(
  token: string,
): Promise<EnumOption[]> {
  return apiFetch<EnumOption[]>(
    "/employees/sexes",
    token,
    undefined,
    "Could not load sex options.",
  );
}

export async function listPayrollStatuses(
  token: string,
): Promise<EnumOption[]> {
  return apiFetch<EnumOption[]>(
    "/payrolls/statuses",
    token,
    undefined,
    "Could not load payroll statuses.",
  );
}

export async function listPayslipStatuses(
  token: string,
): Promise<EnumOption[]> {
  return apiFetch<EnumOption[]>(
    "/payslips/statuses",
    token,
    undefined,
    "Could not load payslip statuses.",
  );
}

export async function fetchEmployee(
  token: string,
  id: string,
): Promise<EmployeeDetail> {
  return apiFetch<EmployeeDetail>(
    `/employees/${id}`,
    token,
    undefined,
    "Could not load the employee.",
  );
}

// The backend DTOs map camelCase properties from snake_case keys
// (`@Expose({ name: "phone_number" })`, etc.), so request bodies must
// use snake_case. Verified: camelCase payloads are rejected with 400.
export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  address: string;
  sex: string;
  birth_date: string;
  join_at: string;
  leave_at?: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  email?: string;
  password?: string;
  phone_number?: string;
  address?: string;
  sex?: string;
  birth_date?: string;
  join_at?: string;
  leave_at?: string | null;
}

export async function createEmployee(
  token: string,
  payload: CreateEmployeePayload,
): Promise<EmployeeIndex> {
  return apiFetch<EmployeeIndex>(
    "/employees",
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Could not create the employee.",
  );
}

export async function updateEmployee(
  token: string,
  id: string,
  payload: UpdateEmployeePayload,
): Promise<EmployeeIndex> {
  return apiFetch<EmployeeIndex>(
    `/employees/${id}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "Could not update the employee.",
  );
}

export async function deleteEmployee(
  token: string,
  id: string,
): Promise<void> {
  await apiFetch<void>(
    `/employees/${id}`,
    token,
    { method: "DELETE" },
    "Could not delete the employee.",
  );
}

export async function listEmployeesWithActivePayroll(
  token: string,
  query: ListQuery,
): Promise<Paginated<EmployeeDetail>> {
  return apiFetch<Paginated<EmployeeDetail>>(
    `/employees/with-active-payroll${toQueryString(query)}`,
    token,
    undefined,
    "Could not load employees.",
  );
}

export async function fetchPayroll(
  token: string,
  id: string,
): Promise<PayrollSummary> {
  return apiFetch<PayrollSummary>(
    `/payrolls/${id}`,
    token,
    undefined,
    "Could not load the payroll.",
  );
}

export async function fetchPayslip(
  token: string,
  id: string,
): Promise<PayslipSummary> {
  return apiFetch<PayslipSummary>(
    `/payslips/${id}`,
    token,
    undefined,
    "Could not load the payslip.",
  );
}

// Payroll and payslip DTOs map camelCase properties from snake_case keys,
// so request bodies must use snake_case (same as employees).
export interface CreatePayrollPayload {
  employee_id: string;
  account_number: string;
  account_name: string;
  tax_percentage: number;
}

export interface UpdatePayrollPayload {
  account_number?: string;
  account_name?: string;
  tax_percentage?: number;
}

export async function createPayroll(
  token: string,
  payload: CreatePayrollPayload,
): Promise<PayrollSummary> {
  return apiFetch<PayrollSummary>(
    "/payrolls",
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Could not create the payroll.",
  );
}

export async function updatePayroll(
  token: string,
  id: string,
  payload: UpdatePayrollPayload,
): Promise<PayrollSummary> {
  return apiFetch<PayrollSummary>(
    `/payrolls/${id}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "Could not update the payroll.",
  );
}

export interface CreatePayslipPayload {
  payroll_id: string;
  basic_salary: number;
  overtime?: number;
  tax?: number;
  bonus?: number;
  deduction?: number;
  date: string;
}

export interface UpdatePayslipPayload {
  basic_salary?: number;
  overtime?: number;
  tax?: number;
  bonus?: number;
  deduction?: number;
  date?: string;
}

export async function createPayslip(
  token: string,
  payload: CreatePayslipPayload,
): Promise<PayslipSummary> {
  return apiFetch<PayslipSummary>(
    "/payslips",
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Could not create the payslip.",
  );
}

export async function updatePayslip(
  token: string,
  id: string,
  payload: UpdatePayslipPayload,
): Promise<PayslipSummary> {
  return apiFetch<PayslipSummary>(
    `/payslips/${id}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "Could not update the payslip.",
  );
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
