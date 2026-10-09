import { apiFetch, toQueryString } from "./client";
import type { ActionLink, EnumOption, ListQuery, Paginated } from "./types";

export interface ContractSummary {
  id: string;
  employee_id: string;
  type: string;
  title: string;
  start_date: string;
  end_date: string | null;
  signed_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  available_actions: ActionLink[];
}

export async function listContracts(
  token: string,
  query: ListQuery,
): Promise<Paginated<ContractSummary>> {
  return apiFetch<Paginated<ContractSummary>>(
    `/contracts${toQueryString(query)}`,
    token,
    undefined,
    "Could not load contracts.",
  );
}

export async function listContractTypes(
  token: string,
): Promise<EnumOption[]> {
  return apiFetch<EnumOption[]>(
    "/contracts/types",
    token,
    undefined,
    "Could not load contract types.",
  );
}

export async function listContractStatuses(
  token: string,
): Promise<EnumOption[]> {
  return apiFetch<EnumOption[]>(
    "/contracts/statuses",
    token,
    undefined,
    "Could not load contract statuses.",
  );
}

export async function fetchContract(
  token: string,
  id: string,
): Promise<ContractSummary> {
  return apiFetch<ContractSummary>(
    `/contracts/${id}`,
    token,
    undefined,
    "Could not load the contract.",
  );
}

// Contract DTOs map camelCase properties from snake_case keys, so
// request bodies must use snake_case (same as the other resources).
export interface CreateContractPayload {
  employee_id: string;
  type: string;
  title: string;
  start_date: string;
  end_date?: string;
}

export interface UpdateContractPayload {
  type?: string;
  title?: string;
  start_date?: string;
  end_date?: string;
}

export async function createContract(
  token: string,
  payload: CreateContractPayload,
): Promise<ContractSummary> {
  return apiFetch<ContractSummary>(
    "/contracts",
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    "Could not create the contract.",
  );
}

export async function updateContract(
  token: string,
  id: string,
  payload: UpdateContractPayload,
): Promise<ContractSummary> {
  return apiFetch<ContractSummary>(
    `/contracts/${id}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    "Could not update the contract.",
  );
}
