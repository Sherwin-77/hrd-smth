"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  clearAuthSession,
  executeAction,
  fetchPayslip,
  getAuthToken,
  listPayslipStatuses,
  type ActionLink,
  type PayslipSummary,
} from "@/lib/api";
import { enumLabel, useEnumOptions } from "@/lib/use-enum-options";
import ActionButtons from "@/components/shared/action-buttons";

export default function PayslipDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [payslip, setPayslip] = useState<PayslipSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { options: statusOptions, error: enumError } = useEnumOptions(
    listPayslipStatuses,
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
    fetchPayslip(token, params.id)
      .then((result) => {
        if (!active) return;
        setPayslip(result);
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
        router.push("/dashboard/payslips");
        return;
      }
      const result = await executeAction<PayslipSummary>(token, link);
      setPayslip(result);
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

  if (status === "error" || !payslip) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Payslip</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error ?? "Could not load the payslip."}
        </p>
        <Link
          href="/dashboard/payslips"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Back to payslips
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
          href="/dashboard/payslips"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to payslips
        </Link>
        <ActionButtons
          actions={payslip.available_actions ?? []}
          editHref={`/dashboard/payslips/${params.id}/edit`}
          pendingId={actionPending}
          error={actionError}
          onAction={handleAction}
        />
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Payslip - {new Date(payslip.date).toLocaleDateString()}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {payslip ? enumLabel(statusOptions, payslip.status) : null}
        </p>
      </section>

      <section
        aria-label="Payslip details"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">Details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-600">Basic salary</dt>
            <dd className="text-gray-900">{payslip.basic_salary}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Overtime</dt>
            <dd className="text-gray-900">{payslip.overtime}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Bonus</dt>
            <dd className="text-gray-900">{payslip.bonus}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Tax</dt>
            <dd className="text-gray-900">{payslip.tax}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Deduction</dt>
            <dd className="text-gray-900">{payslip.deduction}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Net pay</dt>
            <dd className="font-medium text-gray-900">{payslip.total}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Status</dt>
            <dd className="text-gray-900">
              {payslip ? enumLabel(statusOptions, payslip.status) : null}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Date</dt>
            <dd className="text-gray-900">
              {new Date(payslip.date).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
