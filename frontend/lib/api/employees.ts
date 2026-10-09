import { apiFetch, toQueryString } from "./client";
import type { EnumOption, ListQuery, Paginated } from "./types";
import type { PayrollSummary } from "./payrolls";
import type { PayslipSummary } from "./payslips";

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
