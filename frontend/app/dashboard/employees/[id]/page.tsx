"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  clearAuthSession,
  deleteEmployee,
  fetchEmployee,
  fetchEmployeeRoles,
  getAuthToken,
  listPayslipStatuses,
  listRoles,
  setEmployeeRoles,
  type EmployeeDetail,
  type EmployeeRoleRef,
  type RoleSummary,
} from "@/lib/api";
import { enumLabel, useEnumOptions } from "@/lib/use-enum-options";
import NoAccess from "@/components/shared/no-access";
import { can, usePermissions } from "@/lib/permissions";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { permissions, ready: permissionsReady } = usePermissions();
  const allowed = can(permissions, "employees", "view");
  const canManage = can(permissions, "employees", "manage");
  const canSeePayslips = can(permissions, "payslips", "view");
  const canManageRoles = can(permissions, "roles", "manage");
  const canSeeRoles = can(permissions, "roles", "view");
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [assignedRoles, setAssignedRoles] = useState<EmployeeRoleRef[]>([]);
  const [allRoles, setAllRoles] = useState<RoleSummary[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const { options: payslipStatusOptions, error: enumError } =
    useEnumOptions(listPayslipStatuses);

  useEffect(() => {
    if (enumError && enumError.includes("Session expired")) {
      clearAuthSession();
      router.replace("/login");
    }
  }, [router, enumError]);

  useEffect(() => {
    if (!permissionsReady) return;
    if (!allowed) return;
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    fetchEmployee(token, params.id)
      .then((result) => {
        if (!active) return;
        setDetail(result);
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

  useEffect(() => {
    if (!permissionsReady) return;
    if (!allowed || !canSeeRoles) return;
    const token = getAuthToken();
    if (!token) return;
    let active = true;
    fetchEmployeeRoles(token, params.id)
      .then((result) => {
        if (!active) return;
        setAssignedRoles(result);
        setSelectedRoleIds(result.map((r) => r.id));
      })
      .catch(() => {
        if (!active) return;
        setRolesError("Could not load roles.");
      });
    if (canManageRoles) {
      listRoles(token)
        .then((result) => {
          if (!active) return;
          setAllRoles(result);
        })
        .catch(() => {
          if (!active) return;
          setRolesError("Could not load roles.");
        });
    }
    return () => {
      active = false;
    };
  }, [params.id, permissionsReady, allowed, canSeeRoles, canManageRoles]);

  async function handleSaveRoles() {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSavingRoles(true);
    setRolesError(null);
    try {
      const updated = await setEmployeeRoles(token, params.id, selectedRoleIds);
      setAssignedRoles(updated);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setRolesError(
        err instanceof Error ? err.message : "Could not update roles.",
      );
    } finally {
      setSavingRoles(false);
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
      await deleteEmployee(token, params.id);
      router.push("/dashboard/employees");
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setDeleteError(
        err instanceof Error ? err.message : "Could not delete the employee.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (status === "loading" || !permissionsReady) {
    return <p className="text-sm text-gray-600">Loading...</p>;
  }

  if (permissionsReady && !allowed) {
    return (
      <NoAccess
        title="Employee"
        backHref="/dashboard/employees"
        backLabel="Back to employees"
      />
    );
  }

  if (status === "error" || !detail) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Employee</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error ?? "Could not load the employee."}
        </p>
        <Link
          href="/dashboard/employees"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Back to employees
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Breadcrumb">
        <Link
          href="/dashboard/employees"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to employees
        </Link>
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">
              {detail.name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">{detail.email}</p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            {canManage ? (
              <>
                <Link
                  href={`/dashboard/employees/${params.id}/edit`}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                >
                  Edit
                </Link>
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
              </>
            ) : null}
          </div>
        </div>
        {confirmingDelete ? (
          <div
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2"
          >
            <p className="text-sm text-red-700">
              Delete {detail.name}? This cannot be undone.
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
        aria-label="Employee details"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">Details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-600">Phone</dt>
            <dd className="text-gray-900">{detail.phone_number}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Address</dt>
            <dd className="text-gray-900">{detail.address}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Birth date</dt>
            <dd className="text-gray-900">
              {new Date(detail.birth_date).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Joined</dt>
            <dd className="text-gray-900">
              {new Date(detail.join_at).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Left</dt>
            <dd className="text-gray-900">
              {detail.leave_at
                ? new Date(detail.leave_at).toLocaleDateString()
                : "-"}
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-label="Active payroll"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Active payroll
        </h2>
        {detail.active_payroll ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-600">Account name</dt>
              <dd className="text-gray-900">
                {detail.active_payroll.account_name}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Account number</dt>
              <dd className="text-gray-900">
                {detail.active_payroll.account_number}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Tax percentage</dt>
              <dd className="text-gray-900">
                {detail.active_payroll.tax_percentage * 100}%
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            No active payroll for this employee.
          </p>
        )}
      </section>

      <section
        aria-label="Payslips"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Payslips ({detail.payslips.length})
        </h2>
        {detail.payslips.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No payslips found.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {detail.payslips.map((payslip) => (
              <li
                key={payslip.id}
                className="flex items-center justify-between gap-4 rounded-md border border-gray-200 px-3 py-2"
              >
                <span className="text-gray-900">
                  {new Date(payslip.date).toLocaleDateString()} -{" "}
                  {enumLabel(payslipStatusOptions, payslip.status)}
                </span>
                {canSeePayslips ? (
                  <Link
                    href={`/dashboard/payslips/${payslip.id}`}
                    className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Detail
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {canSeeRoles ? (
        <section
          aria-label="Roles"
          className="rounded-lg border border-gray-200 bg-white p-6"
        >
          <h2 className="text-base font-semibold text-gray-900">Roles</h2>
          {rolesError ? (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {rolesError}
            </p>
          ) : null}
          {canManageRoles ? (
            <div className="mt-4 flex flex-col gap-2">
              {allRoles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 text-sm text-gray-900"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={(event) => {
                      setSelectedRoleIds((prev) =>
                        event.target.checked
                          ? [...prev, role.id]
                          : prev.filter((id) => id !== role.id),
                      );
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  {role.name}
                  {role.is_system ? (
                    <span className="text-xs text-gray-600">(system)</span>
                  ) : null}
                </label>
              ))}
              <div>
                <button
                  type="button"
                  onClick={handleSaveRoles}
                  disabled={savingRoles}
                  className="mt-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {savingRoles ? "Saving..." : "Save roles"}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-600">
              {assignedRoles.length === 0
                ? "No roles assigned."
                : assignedRoles.map((r) => r.name).join(", ")}
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
