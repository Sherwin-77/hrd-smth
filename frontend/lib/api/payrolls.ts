import { apiFetch, toQueryString } from "./client";
import type { ActionLink, EnumOption, ListQuery, Paginated } from "./types";

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
