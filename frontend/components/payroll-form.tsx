"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";

export interface PayrollEmployeeOption {
  id: string;
  name: string;
  email: string;
}

export interface PayrollFormValues {
  employeeId: string;
  accountNumber: string;
  accountName: string;
  /** Tax as 0–100; the page converts to the API's 0–1 fraction. */
  taxPercent: number;
}

interface PayrollFormProps {
  mode: "create" | "edit";
  initial?: Partial<PayrollFormValues>;
  saving: boolean;
  serverError: string | null;
  cancelHref: string;
  onSubmit: (values: PayrollFormValues) => void;
  /** Create mode only: employees for the dropdown. */
  employeeOptions?: PayrollEmployeeOption[];
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

export default function PayrollForm({
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
}: PayrollFormProps) {
  const [employeeId, setEmployeeId] = useState(initial?.employeeId ?? "");
  const [accountNumber, setAccountNumber] = useState(
    initial?.accountNumber ?? "",
  );
  const [accountName, setAccountName] = useState(initial?.accountName ?? "");
  const [taxPercent, setTaxPercent] = useState(
    initial?.taxPercent != null ? String(initial.taxPercent) : "",
  );
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (mode === "create" && !employeeId) {
      setFormError("Select an employee.");
      return;
    }
    if (!accountNumber.trim() || !accountName.trim()) {
      setFormError("Fill in all required fields.");
      return;
    }
    const percent = Number(taxPercent);
    if (
      taxPercent.trim() === "" ||
      Number.isNaN(percent) ||
      percent < 0 ||
      percent > 100
    ) {
      setFormError("Enter a tax percentage between 0 and 100.");
      return;
    }

    onSubmit({
      employeeId,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      taxPercent: percent,
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
        <Field id="payroll-employee" label="Employee">
          <input
            id="payroll-employee-search"
            type="search"
            value={employeeSearch ?? ""}
            onChange={(event) => onEmployeeSearchChange?.(event.target.value)}
            placeholder="Search employees"
            className={inputClassName}
          />
          <select
            id="payroll-employee"
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
              <option key={option.id} value={option.id}>
                {option.name} ({option.email})
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <Field id="payroll-account-number" label="Account number">
        <input
          id="payroll-account-number"
          name="accountNumber"
          type="text"
          required
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
          placeholder="Account number"
          className={inputClassName}
        />
      </Field>

      <Field id="payroll-account-name" label="Account name">
        <input
          id="payroll-account-name"
          name="accountName"
          type="text"
          required
          value={accountName}
          onChange={(event) => setAccountName(event.target.value)}
          placeholder="Account name"
          className={inputClassName}
        />
      </Field>

      <Field
        id="payroll-tax"
        label="Tax (%)"
        hint="Enter 10 for 10%. Stored as a 0–1 fraction."
      >
        <input
          id="payroll-tax"
          name="taxPercent"
          type="number"
          required
          min="0"
          max="100"
          step="0.01"
          value={taxPercent}
          onChange={(event) => setTaxPercent(event.target.value)}
          placeholder="10"
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
              ? "Create payroll"
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

/** Convert a 0–1 API fraction to a 0–100 form input value. */
export function toPercentInput(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  return Number((value * 100).toPrecision(12)).toString();
}
