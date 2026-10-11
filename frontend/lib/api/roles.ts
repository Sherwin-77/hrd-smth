import { apiFetch } from "./client";

export interface RoleSummary {
  id: string;
  name: string;
  is_system: boolean;
  permissions: string[];
}

export interface PermissionItem {
  name: string;
  action: string;
}

export interface PermissionCatalogGroup {
  group: string;
  permissions: PermissionItem[];
}

export async function listRoles(token: string): Promise<RoleSummary[]> {
  return apiFetch<RoleSummary[]>(
    "/roles",
    token,
    undefined,
    "Could not load roles.",
  );
}

export async function fetchRole(
  token: string,
  id: string,
): Promise<RoleSummary> {
  return apiFetch<RoleSummary>(
    `/roles/${id}`,
    token,
    undefined,
    "Could not load the role.",
  );
}

export async function createRole(
  token: string,
  name: string,
): Promise<RoleSummary> {
  return apiFetch<RoleSummary>(
    "/roles",
    token,
    { method: "POST", body: JSON.stringify({ name }) },
    "Could not create the role.",
  );
}

export async function updateRole(
  token: string,
  id: string,
  name: string,
): Promise<RoleSummary> {
  return apiFetch<RoleSummary>(
    `/roles/${id}`,
    token,
    { method: "PATCH", body: JSON.stringify({ name }) },
    "Could not update the role.",
  );
}

export async function deleteRole(token: string, id: string): Promise<void> {
  await apiFetch<void>(
    `/roles/${id}`,
    token,
    { method: "DELETE" },
    "Could not delete the role.",
  );
}

export async function setRolePermissions(
  token: string,
  id: string,
  permissions: string[],
): Promise<RoleSummary> {
  return apiFetch<RoleSummary>(
    `/roles/${id}/permissions`,
    token,
    { method: "PUT", body: JSON.stringify({ permissions }) },
    "Could not update role permissions.",
  );
}

export async function listPermissionGroups(
  token: string,
): Promise<PermissionCatalogGroup[]> {
  return apiFetch<PermissionCatalogGroup[]>(
    "/permissions",
    token,
    undefined,
    "Could not load permissions.",
  );
}
