"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";

export interface PayslipEmployeeOption {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  /** Null when the employee has no active payroll. */
  payrollId: string | null;
  accountName: string | null;
  accountNumber: string | null;
}

export interface PayslipFormValues {
  /** Resolved from the selected employee's active payroll. Always "" in edit mode; the page ignores it. */
  payrollId: string;
  basicSalary: number;
  overtime?: number;
  tax?: number;
  bonus?: number;
  deduction?: number;
  date: string;
}

interface PayslipFormProps {
  mode: "create" | "edit";
  initial?: Partial<PayslipFormValues>;
  saving: boolean;
  serverError: string | null;
  cancelHref: string;
  onSubmit: (values: PayslipFormValues) => void;
  /** Create mode only: employees with their active payroll. */
  employeeOptions?: PayslipEmployeeOption[];
  employeeSearch?: string;
  searchingEmployees?: boolean;
  onEmployeeSearchChange?: (value: string) => void;
}

const inputClassName =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-700 focus:outline-none";

function Field({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-gray-600">{hint}</p> : null}
    </div>
  );
}

function toAmount(value: string | number | undefined): string {
  if (value == null) return "";
  return String(value);
}

/** Empty means "not set"; otherwise must be a number >= 0. */
function parseOptionalAmount(
  raw: string,
  fieldName: string,
): { value?: number; error?: string } {
  if (raw.trim() === "") return {};
  const parsed = Number(raw);
  if (Number.isNaN(parsed) || parsed < 0) {
    return { error: `${fieldName} must be zero or more.` };
  }
  return { value: parsed };
}

export default function PayslipForm({
  mode,
  initial,
  saving,
  serverError,
  cancelHref,
  onSubmit,
  employeeOptions,
  employeeSearch,
  searchingEmployees,
  onEmployeeSearchChange,
}: PayslipFormProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [basicSalary, setBasicSalary] = useState(
    toAmount(initial?.basicSalary),
  );
  const [overtime, setOvertime] = useState(toAmount(initial?.overtime));
  const [tax, setTax] = useState(toAmount(initial?.tax));
  const [bonus, setBonus] = useState(toAmount(initial?.bonus));
  const [deduction, setDeduction] = useState(toAmount(initial?.deduction));
  const [date, setDate] = useState(initial?.date ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const selected =
    mode === "create"
      ? (employeeOptions ?? []).find((o) => o.employeeId === employeeId)
      : undefined;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    let payrollId = "";
    if (mode === "create") {
      if (!selected) {
        setFormError("Select an employee.");
        return;
      }
      if (!selected.payrollId) {
        setFormError("The selected employee has no active payroll.");
        return;
      }
      payrollId = selected.payrollId;
    }

    const basic = Number(basicSalary);
    if (
      basicSalary.trim() === "" ||
      Number.isNaN(basic) ||
      basic < 0
    ) {
      setFormError("Enter a basic salary of zero or more.");
      return;
    }
    const parsedOvertime = parseOptionalAmount(overtime, "Overtime");
    const parsedTax = parseOptionalAmount(tax, "Tax");
    const parsedBonus = parseOptionalAmount(bonus, "Bonus");
    const parsedDeduction = parseOptionalAmount(deduction, "Deduction");
    for (const parsed of [
      parsedOvertime,
      parsedTax,
      parsedBonus,
      parsedDeduction,
    ]) {
      if (parsed.error) {
        setFormError(parsed.error);
        return;
      }
    }
    if (!date) {
      setFormError("Pick a date.");
      return;
    }

    onSubmit({
      payrollId,
      basicSalary: basic,
      ...(parsedOvertime.value !== undefined
        ? { overtime: parsedOvertime.value }
        : {}),
      ...(parsedTax.value !== undefined ? { tax: parsedTax.value } : {}),
      ...(parsedBonus.value !== undefined ? { bonus: parsedBonus.value } : {}),
      ...(parsedDeduction.value !== undefined
        ? { deduction: parsedDeduction.value }
        : {}),
      date,
    });
  }

  const error = formError ?? serverError;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {mode === "create" ? (
        <Field id="payslip-employee" label="Employee">
          <input
            id="payslip-employee-search"
            type="search"
            value={employeeSearch ?? ""}
            onChange={(event) => onEmployeeSearchChange?.(event.target.value)}
            placeholder="Search employees"
            className={inputClassName}
          />
          <select
            id="payslip-employee"
            name="employeeId"
            required
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
            className={`${inputClassName} mt-2`}
          >
            <option value="">
              {searchingEmployees ? "Searching..." : "Select an employee"}
            </option>
            {(employeeOptions ?? []).map((option) => (
              <option
                key={option.employeeId}
                value={option.employeeId}
                disabled={!option.payrollId}
              >
                {option.employeeName} ({option.employeeEmail})
                {option.payrollId ? "" : " - no active payroll"}
              </option>
            ))}
          </select>
          {selected?.payrollId ? (
            <p className="mt-1 text-xs text-gray-600">
              Payroll: {selected.accountName} ({selected.accountNumber})
            </p>
          ) : null}
        </Field>
      ) : null}

      <Field id="payslip-basic" label="Basic salary">
        <input
          id="payslip-basic"
          name="basicSalary"
          type="number"
          required
          min="0"
          step="0.01"
          value={basicSalary}
          onChange={(event) => setBasicSalary(event.target.value)}
          placeholder="0"
          className={inputClassName}
        />
      </Field>

      <Field id="payslip-overtime" label="Overtime (optional)">
        <input
          id="payslip-overtime"
          name="overtime"
          type="number"
          min="0"
          step="0.01"
          value={overtime}
          onChange={(event) => setOvertime(event.target.value)}
          placeholder="0"
          className={inputClassName}
        />
      </Field>

      <Field id="payslip-tax" label="Tax (optional)">
        <input
          id="payslip-tax"
          name="tax"
          type="number"
          min="0"
          step="0.01"
          value={tax}
          onChange={(event) => setTax(event.target.value)}
          placeholder="0"
          className={inputClassName}
        />
      </Field>

      <Field id="payslip-bonus" label="Bonus (optional)">
        <input
          id="payslip-bonus"
          name="bonus"
          type="number"
          min="0"
          step="0.01"
          value={bonus}
          onChange={(event) => setBonus(event.target.value)}
          placeholder="0"
          className={inputClassName}
        />
      </Field>

      <Field id="payslip-deduction" label="Deduction (optional)">
        <input
          id="payslip-deduction"
          name="deduction"
          type="number"
          min="0"
          step="0.01"
          value={deduction}
          onChange={(event) => setDeduction(event.target.value)}
          placeholder="0"
          className={inputClassName}
        />
      </Field>

      <Field id="payslip-date" label="Date">
        <input
          id="payslip-date"
          name="date"
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className={inputClassName}
        />
      </Field>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : mode === "create"
              ? "Create payslip"
              : "Save changes"}
        </button>
        <Link
          href={cancelHref}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

/** Convert an ISO timestamp from the API to a YYYY-MM-DD date input value. */
export function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "";
  return new Date(value).toISOString().slice(0, 10);
}
