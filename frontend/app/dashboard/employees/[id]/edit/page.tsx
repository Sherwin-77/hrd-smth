"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import EmployeeForm, {
  toDateInput,
  type EmployeeFormValues,
} from "@/components/employee-form";
import {
  clearAuthSession,
  fetchEmployee,
  getAuthToken,
  updateEmployee,
} from "@/lib/api";

export default function EditEmployeePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<EmployeeFormValues | null>(null);
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
    fetchEmployee(token, params.id)
      .then((detail) => {
        if (!active) return;
        setInitial({
          name: detail.name,
          email: detail.email,
          password: "",
          phoneNumber: detail.phone_number,
          address: detail.address,
          sex: detail.sex === "female" ? "female" : "male",
          birthDate: toDateInput(detail.birth_date),
          joinAt: toDateInput(detail.join_at),
          leaveAt: toDateInput(detail.leave_at),
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

  async function handleSubmit(values: EmployeeFormValues) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const updated = await updateEmployee(token, params.id, {
        name: values.name,
        email: values.email,
        ...(values.password ? { password: values.password } : {}),
        phone_number: values.phoneNumber,
        address: values.address,
        sex: values.sex,
        birth_date: values.birthDate,
        join_at: values.joinAt,
        leave_at: values.leaveAt ? values.leaveAt : null,
      });
      router.push(`/dashboard/employees/${updated.id}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setServerError(
        err instanceof Error ? err.message : "Could not update the employee.",
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
        <h1 className="text-xl font-semibold text-gray-900">Edit employee</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {loadError ?? "Could not load the employee."}
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
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit employee</h1>
        <p className="mt-1 text-sm text-gray-600">{initial.email}</p>
        <Link
          href={`/dashboard/employees/${params.id}`}
          className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Back to detail
        </Link>
      </section>

      <section
        aria-label="Edit employee form"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <EmployeeForm
          mode="edit"
          initial={initial}
          saving={saving}
          serverError={serverError}
          cancelHref={`/dashboard/employees/${params.id}`}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
