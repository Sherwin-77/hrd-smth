"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  clearAuthSession,
  executeAction,
  fetchPayroll,
  getAuthToken,
  listPayrollStatuses,
  type ActionLink,
  type PayrollSummary,
} from "@/lib/api";
import { enumLabel, useEnumOptions } from "@/lib/use-enum-options";
import ActionButtons from "@/components/shared/action-buttons";

export default function PayrollDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [payroll, setPayroll] = useState<PayrollSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { options: statusOptions, error: enumError } = useEnumOptions(
    listPayrollStatuses,
  );

  useEffect(() => {
    if (enumError && enumError.includes("Session expired")) {
      clearAuthSession();
      router.replace("/login");
    }
  }, [router, enumError]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    fetchPayroll(token, params.id)
      .then((result) => {
        if (!active) return;
        setPayroll(result);
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
  }, [router, params.id]);

  async function handleAction(link: ActionLink) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setActionPending(link.id);
    setActionError(null);
    try {
      if (link.method === "DELETE") {
        await executeAction<void>(token, link);
        router.push("/dashboard/payrolls");
        return;
      }
      const result = await executeAction<PayrollSummary>(token, link);
      setPayroll(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setActionError(
        err instanceof Error ? err.message : "Could not complete the action.",
      );
    } finally {
      setActionPending(null);
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-gray-600">Loading...</p>;
  }

  if (status === "error" || !payroll) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Payroll</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error ?? "Could not load the payroll."}
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
    <div className="flex flex-col gap-4">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center justify-between gap-4"
      >
        <Link
          href="/dashboard/payrolls"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to payrolls
        </Link>
        <ActionButtons
          actions={payroll.available_actions ?? []}
          editHref={`/dashboard/payrolls/${params.id}/edit`}
          pendingId={actionPending}
          error={actionError}
          onAction={handleAction}
        />
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {payroll.account_name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{payroll.account_number}</p>
      </section>

      <section
        aria-label="Payroll details"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">Details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-600">Account name</dt>
            <dd className="text-gray-900">{payroll.account_name}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Account number</dt>
            <dd className="text-gray-900">{payroll.account_number}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Tax percentage</dt>
            <dd className="text-gray-900">{payroll.tax_percentage}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Status</dt>
            <dd className="text-gray-900">
              {payroll ? enumLabel(statusOptions, payroll.status) : null}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Created</dt>
            <dd className="text-gray-900">
              {new Date(payroll.created_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Updated</dt>
            <dd className="text-gray-900">
              {new Date(payroll.updated_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
