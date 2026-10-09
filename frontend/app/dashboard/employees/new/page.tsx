"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmployeeForm, {
  type EmployeeFormValues,
} from "@/components/employee-form";
import {
  clearAuthSession,
  createEmployee,
  getAuthToken,
  listEmployeeSexes,
} from "@/lib/api";
import { useEnumOptions } from "@/lib/use-enum-options";

export default function NewEmployeePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    options: sexOptions,
    status: sexStatus,
    error: sexError,
    retry: retrySex,
  } = useEnumOptions(listEmployeeSexes);

  useEffect(() => {
    if (sexError && sexError.includes("Session expired")) {
      clearAuthSession();
      router.replace("/login");
    }
  }, [router, sexError]);

  async function handleSubmit(values: EmployeeFormValues) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const created = await createEmployee(token, {
        name: values.name,
        email: values.email,
        password: values.password,
        phone_number: values.phoneNumber,
        address: values.address,
        sex: values.sex,
        birth_date: values.birthDate,
        join_at: values.joinAt,
        ...(values.leaveAt ? { leave_at: values.leaveAt } : {}),
      });
      router.push(`/dashboard/employees/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setServerError(
        err instanceof Error ? err.message : "Could not create the employee.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <nav aria-label="Breadcrumb">
        <Link
          href="/dashboard/employees"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to employees
        </Link>
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">New employee</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the details below to add an employee.
        </p>
      </section>

      <section
        aria-label="New employee form"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <EmployeeForm
          mode="create"
          saving={saving}
          serverError={serverError}
          cancelHref="/dashboard/employees"
          onSubmit={handleSubmit}
          sexOptions={sexOptions}
          sexStatus={sexStatus}
          sexError={sexError}
          onSexRetry={retrySex}
        />
      </section>
    </div>
  );
}
