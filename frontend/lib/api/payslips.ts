import { apiFetch, toQueryString } from "./client";
import type { ActionLink, EnumOption, ListQuery, Paginated } from "./types";

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
