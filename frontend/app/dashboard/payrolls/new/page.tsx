"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PayrollForm, {
  type PayrollEmployeeOption,
  type PayrollFormValues,
} from "@/components/payrolls/payroll-form";
import {
  clearAuthSession,
  createPayroll,
  getAuthToken,
  listEmployees,
} from "@/lib/api";

export default function NewPayrollPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<
    PayrollEmployeeOption[]
  >([]);
  const [searchingEmployees, setSearchingEmployees] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    const timer = setTimeout(() => {
      listEmployees(token, { limit: 20, search: employeeSearch })
        .then((result) => {
          if (!active) return;
          setEmployeeOptions(
            result.data.map((row) => ({
              id: row.id,
              name: row.name,
              email: row.email,
            })),
          );
          setSearchingEmployees(false);
        })
        .catch(() => {
          if (!active) return;
          setSearchingEmployees(false);
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [router, employeeSearch]);

  async function handleSubmit(values: PayrollFormValues) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const created = await createPayroll(token, {
        employee_id: values.employeeId,
        account_number: values.accountNumber,
        account_name: values.accountName,
        tax_percentage: values.taxPercent / 100,
      });
      router.push(`/dashboard/payrolls/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setServerError(
        err instanceof Error ? err.message : "Could not create the payroll.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <nav aria-label="Breadcrumb">
        <Link
          href="/dashboard/payrolls"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to payrolls
        </Link>
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">New payroll</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the details below to add a payroll.
        </p>
      </section>

      <section
        aria-label="New payroll form"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <PayrollForm
          mode="create"
          saving={saving}
          serverError={serverError}
          cancelHref="/dashboard/payrolls"
          onSubmit={handleSubmit}
          employeeOptions={employeeOptions}
          employeeSearch={employeeSearch}
          searchingEmployees={searchingEmployees}
          onEmployeeSearchChange={(value) => {
            setEmployeeSearch(value);
            setSearchingEmployees(true);
          }}
        />
      </section>
    </div>
  );
}
