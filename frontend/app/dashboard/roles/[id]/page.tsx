"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  clearAuthSession,
  deleteRole,
  fetchRole,
  getAuthToken,
  listPermissionGroups,
  setRolePermissions,
  updateRole,
  type PermissionCatalogGroup,
  type RoleSummary,
} from "@/lib/api";
import NoAccess from "@/components/shared/no-access";
import { can, usePermissions } from "@/lib/permissions";

export default function RoleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { permissions, ready: permissionsReady } = usePermissions();
  const allowed = can(permissions, "roles", "view");
  const canManage = can(permissions, "roles", "manage");
  const [role, setRole] = useState<RoleSummary | null>(null);
  const [groups, setGroups] = useState<PermissionCatalogGroup[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!permissionsReady) return;
    if (!allowed) return;
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    Promise.all([fetchRole(token, params.id), listPermissionGroups(token)])
      .then(([fetched, catalog]) => {
        if (!active) return;
        setRole(fetched);
        setName(fetched.name);
        setSelected(fetched.permissions);
        setGroups(catalog);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof Error && err.message.includes("Session expired")) {
          clearAuthSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load.");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [router, params.id, permissionsReady, allowed]);

  async function handleSave() {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const trimmed = name.trim();
      if (role && trimmed !== role.name) {
        await updateRole(token, params.id, trimmed);
      }
      const updated = await setRolePermissions(token, params.id, selected);
      setRole(updated);
      setName(updated.name);
      setSelected(updated.permissions);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setSaveError(
        err instanceof Error ? err.message : "Could not save the role.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteRole(token, params.id);
      router.push("/dashboard/roles");
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete the role.",
      );
    } finally {
      setDeleting(false);
    }
  }

  function togglePermission(permission: string) {
    setSelected((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  }

  if (status === "loading" || !permissionsReady) {
    return <p className="text-sm text-gray-600">Loading...</p>;
  }

  if (permissionsReady && !allowed) {
    return (
      <NoAccess
        title="Role"
        backHref="/dashboard/roles"
        backLabel="Back to roles"
      />
    );
  }

  if (status === "error" || !role) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Role</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error ?? "Could not load the role."}
        </p>
        <Link
          href="/dashboard/roles"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Back to roles
        </Link>
      </section>
    );
  }

  const inputsDisabled = !canManage || saving || role.is_system;

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb">
        <Link
          href="/dashboard/roles"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to roles
        </Link>
      </nav>

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-gray-900">{role.name}</h1>
            {role.is_system ? (
              <p className="mt-1 text-sm text-gray-600">
                System role: name and permissions cannot be changed.
              </p>
            ) : null}
          </div>
          {canManage && !role.is_system ? (
            <div className="flex shrink-0 gap-2">
              {confirmingDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(false);
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Delete
                </button>
              )}
            </div>
          ) : null}
        </div>
        {confirmingDelete && canManage && !role.is_system ? (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2"
          >
            <p className="text-sm text-red-700">
              Delete {role.name}? Employees keep their other roles.
            </p>
            {deleteError ? (
              <p className="mt-1 text-sm text-red-700">{deleteError}</p>
            ) : null}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Confirm delete"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section
        aria-label="Role name"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <label
          htmlFor="role-name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Name
        </label>
        <input
          id="role-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={!canManage || role.is_system}
          maxLength={255}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-700 focus:outline-none disabled:opacity-60"
        />
      </section>

      <section
        aria-label="Role permissions"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">Permissions</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage includes view for the same group.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          {groups.map((group) => (
            <fieldset key={group.group}>
              <legend className="text-sm font-medium text-gray-700 capitalize">
                {group.group}
              </legend>
              <div className="mt-2 flex gap-6">
                {group.permissions.map((permission) => (
                  <label
                    key={permission.name}
                    className="flex items-center gap-2 text-sm text-gray-900"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(permission.name)}
                      onChange={() => togglePermission(permission.name)}
                      disabled={inputsDisabled}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {permission.action}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        {saveError ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {saveError}
          </p>
        ) : null}
        {canManage && !role.is_system ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save role"}
          </button>
        ) : null}
      </section>
    </div>
  );
}
