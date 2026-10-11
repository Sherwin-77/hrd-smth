"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PayrollForm, {
  toPercentInput,
  type PayrollFormValues,
} from "@/components/payrolls/payroll-form";
import {
  clearAuthSession,
  fetchPayroll,
  getAuthToken,
  updatePayroll,
} from "@/lib/api";
import NoAccess from "@/components/shared/no-access";
import { can, usePermissions } from "@/lib/permissions";

export default function EditPayrollPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { permissions, ready: permissionsReady } = usePermissions();
  const allowed = can(permissions, "payrolls", "manage");
  const [initial, setInitial] = useState<PayrollFormValues | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!permissionsReady) return;
    if (!allowed) return;
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    fetchPayroll(token, params.id)
      .then((payroll) => {
        if (!active) return;
        setInitial({
          employeeId: payroll.employee_id,
          accountNumber: payroll.account_number,
          accountName: payroll.account_name,
          taxPercent: Number(toPercentInput(payroll.tax_percentage)),
        });
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof Error && err.message.includes("Session expired")) {
          clearAuthSession();
          router.replace("/login");
          return;
        }
        setLoadError(err instanceof Error ? err.message : "Could not load.");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [router, params.id, permissionsReady, allowed]);

  async function handleSubmit(values: PayrollFormValues) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const updated = await updatePayroll(token, params.id, {
        account_number: values.accountNumber,
        account_name: values.accountName,
        tax_percentage: values.taxPercent / 100,
      });
      router.push(`/dashboard/payrolls/${updated.id}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setServerError(
        err instanceof Error ? err.message : "Could not update the payroll.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || !permissionsReady) {
    return <p className="text-sm text-gray-600">Loading...</p>;
  }

  if (permissionsReady && !allowed) {
    return (
      <NoAccess
        title="Edit payroll"
        backHref={`/dashboard/payrolls/${params.id}`}
        backLabel="Back to detail"
      />
    );
  }

  if (status === "error" || !initial) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit payroll</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {loadError ?? "Could not load the payroll."}
        </p>
        <Link
          href="/dashboard/payrolls"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Back to payrolls
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <nav aria-label="Breadcrumb">
        <Link
          href={`/dashboard/payrolls/${params.id}`}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to detail
        </Link>
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit payroll</h1>
        <p className="mt-1 text-sm text-gray-600">{initial.accountName}</p>
      </section>

      <section
        aria-label="Edit payroll form"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <PayrollForm
          mode="edit"
          initial={initial}
          saving={saving}
          serverError={serverError}
          cancelHref={`/dashboard/payrolls/${params.id}`}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
