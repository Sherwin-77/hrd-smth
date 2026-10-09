"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PayslipForm, {
  toDateInput,
  type PayslipFormValues,
} from "@/components/payslips/payslip-form";
import {
  clearAuthSession,
  fetchPayslip,
  getAuthToken,
  updatePayslip,
} from "@/lib/api";

export default function EditPayslipPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<PayslipFormValues | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    fetchPayslip(token, params.id)
      .then((payslip) => {
        if (!active) return;
        setInitial({
          payrollId: payslip.payroll_id,
          basicSalary: payslip.basic_salary,
          overtime: payslip.overtime,
          tax: payslip.tax,
          bonus: payslip.bonus,
          deduction: payslip.deduction,
          date: toDateInput(payslip.date),
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
  }, [router, params.id]);

  async function handleSubmit(values: PayslipFormValues) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const updated = await updatePayslip(token, params.id, {
        basic_salary: values.basicSalary,
        ...(values.overtime !== undefined
          ? { overtime: values.overtime }
          : {}),
        ...(values.tax !== undefined ? { tax: values.tax } : {}),
        ...(values.bonus !== undefined ? { bonus: values.bonus } : {}),
        ...(values.deduction !== undefined
          ? { deduction: values.deduction }
          : {}),
        date: values.date,
      });
      router.push(`/dashboard/payslips/${updated.id}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setServerError(
        err instanceof Error ? err.message : "Could not update the payslip.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-gray-600">Loading...</p>;
  }

  if (status === "error" || !initial) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit payslip</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {loadError ?? "Could not load the payslip."}
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
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <nav aria-label="Breadcrumb">
        <Link
          href={`/dashboard/payslips/${params.id}`}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to detail
        </Link>
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit payslip</h1>
        <p className="mt-1 text-sm text-gray-600">{initial.date}</p>
      </section>

      <section
        aria-label="Edit payslip form"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <PayslipForm
          mode="edit"
          initial={initial}
          saving={saving}
          serverError={serverError}
          cancelHref={`/dashboard/payslips/${params.id}`}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
