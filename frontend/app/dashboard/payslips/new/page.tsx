"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PayslipForm, {
  type PayslipEmployeeOption,
  type PayslipFormValues,
} from "@/components/payslips/payslip-form";
import {
  clearAuthSession,
  createPayslip,
  getAuthToken,
  listEmployeesWithActivePayroll,
} from "@/lib/api";

export default function NewPayslipPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<
    PayslipEmployeeOption[]
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
      listEmployeesWithActivePayroll(token, {
        limit: 20,
        search: employeeSearch,
      })
        .then((result) => {
          if (!active) return;
          setEmployeeOptions(
            result.data.map((row) => ({
              employeeId: row.id,
              employeeName: row.name,
              employeeEmail: row.email,
              payrollId: row.active_payroll?.id ?? null,
              accountName: row.active_payroll?.account_name ?? null,
              accountNumber: row.active_payroll?.account_number ?? null,
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

  async function handleSubmit(values: PayslipFormValues) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const created = await createPayslip(token, {
        payroll_id: values.payrollId,
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
      router.push(`/dashboard/payslips/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setServerError(
        err instanceof Error ? err.message : "Could not create the payslip.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <nav aria-label="Breadcrumb">
        <Link
          href="/dashboard/payslips"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to payslips
        </Link>
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">New payslip</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the details below to add a payslip.
        </p>
      </section>

      <section
        aria-label="New payslip form"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <PayslipForm
          mode="create"
          saving={saving}
          serverError={serverError}
          cancelHref="/dashboard/payslips"
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
