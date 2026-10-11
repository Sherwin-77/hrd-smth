"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  createRole,
  getAuthToken,
  listRoles,
  type RoleSummary,
} from "@/lib/api";
import NoAccess from "@/components/shared/no-access";
import { can, usePermissions } from "@/lib/permissions";

export default function RolesPage() {
  const router = useRouter();
  const { permissions, ready: permissionsReady } = usePermissions();
  const allowed = can(permissions, "roles", "view");
  const canManage = can(permissions, "roles", "manage");
  const [rows, setRows] = useState<RoleSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!permissionsReady) return;
    if (!allowed) return;
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    listRoles(token)
      .then((result) => {
        if (!active) return;
        setRows(result);
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
  }, [router, permissionsReady, allowed]);

  async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const created = await createRole(token, name.trim());
      setRows((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setName("");
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setFormError(
        err instanceof Error ? err.message : "Could not create the role.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!permissionsReady) {
    return <p className="text-sm text-gray-600">Loading...</p>;
  }

  if (!allowed) {
    return (
      <NoAccess
        title="Roles"
        backHref="/dashboard"
        backLabel="Back to overview"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Roles</h1>
        <p className="mt-1 text-sm text-gray-600">
          {rows.length} role{rows.length === 1 ? "" : "s"} found.
        </p>
      </section>

      {canManage ? (
        <section
          aria-label="New role"
          className="rounded-lg border border-gray-200 bg-white p-6"
        >
          <h2 className="text-base font-semibold text-gray-900">New role</h2>
          <form onSubmit={handleCreate} className="mt-4 flex gap-2">
            <label htmlFor="role-name" className="sr-only">
              Role name
            </label>
            <input
              id="role-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Role name"
              required
              maxLength={255}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-700 focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              className="shrink-0 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Create role"}
            </button>
          </form>
          {formError ? (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {formError}
            </p>
          ) : null}
        </section>
      ) : null}

      <section
        aria-label="Role results"
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white"
      >
        {status === "loading" ? (
          <p className="p-6 text-sm text-gray-600">Loading...</p>
        ) : status === "error" ? (
          <p role="alert" className="p-6 text-sm text-red-700">
            {error ?? "Could not load roles."}
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">No roles found.</p>
        ) : (
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th scope="col" className="px-4 py-2 font-medium">
                  Name
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Permissions
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {row.name}
                    {row.is_system ? (
                      <span className="ml-2 text-xs font-normal text-gray-600">
                        system
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {row.permissions.length}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/roles/${row.id}`}
                      className="inline-block rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
