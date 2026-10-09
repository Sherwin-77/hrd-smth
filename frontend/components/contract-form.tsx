"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import type { EnumOption } from "@/lib/api";
import type { EnumFetchStatus } from "@/lib/use-enum-options";

export interface ContractEmployeeOption {
  id: string;
  name: string;
  email: string;
}

export interface ContractFormValues {
  employeeId: string;
  type: string;
  title: string;
  startDate: string;
  endDate: string;
}

interface ContractFormProps {
  mode: "create" | "edit";
  initial?: Partial<ContractFormValues>;
  saving: boolean;
  serverError: string | null;
  cancelHref: string;
  onSubmit: (values: ContractFormValues) => void;
  typeOptions: EnumOption[] | null;
  typeStatus: EnumFetchStatus;
  typeError: string | null;
  onTypeRetry: () => void;
  /** Create mode only: employees for the dropdown. */
  employeeOptions?: ContractEmployeeOption[];
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

export default function ContractForm({
  mode,
  initial,
  saving,
  serverError,
  cancelHref,
  onSubmit,
  typeOptions,
  typeStatus,
  typeError,
  onTypeRetry,
  employeeOptions,
  employeeSearch,
  searchingEmployees,
  onEmployeeSearchChange,
}: ContractFormProps) {
  const [employeeId, setEmployeeId] = useState(initial?.employeeId ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (mode === "create" && !employeeId) {
      setFormError("Select an employee.");
      return;
    }
    if (!type) {
      setFormError("Select a contract type.");
      return;
    }
    if (!title.trim()) {
      setFormError("Fill in all required fields.");
      return;
    }
    if (!startDate) {
      setFormError("Pick a start date.");
      return;
    }
    if (endDate && endDate < startDate) {
      setFormError("The end date must be on or after the start date.");
      return;
    }

    onSubmit({
      employeeId,
      type,
      title: title.trim(),
      startDate,
      endDate,
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
        <Field id="contract-employee" label="Employee">
          <input
            id="contract-employee-search"
            type="search"
            value={employeeSearch ?? ""}
            onChange={(event) => onEmployeeSearchChange?.(event.target.value)}
            placeholder="Search employees"
            className={inputClassName}
          />
          <select
            id="contract-employee"
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

      <Field id="contract-type" label="Type">
        <select
          id="contract-type"
          name="type"
          required
          disabled={typeStatus !== "ready"}
          value={type}
          onChange={(event) => setType(event.target.value)}
          className={inputClassName}
        >
          {typeStatus !== "ready" ? (
            <option value="">
              {typeStatus === "loading"
                ? "Loading..."
                : "Could not load options"}
            </option>
          ) : (
            <>
              <option value="">Select...</option>
              {(typeOptions ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>
        {typeStatus === "error" ? (
          <p role="alert" className="mt-1 text-xs text-red-700">
            {typeError ?? "Could not load contract types."}{" "}
            <button
              type="button"
              onClick={onTypeRetry}
              className="font-medium text-blue-700 hover:underline"
            >
              Retry
            </button>
          </p>
        ) : null}
      </Field>

      <Field id="contract-title" label="Title">
        <input
          id="contract-title"
          name="title"
          type="text"
          required
          maxLength={255}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Contract title"
          className={inputClassName}
        />
      </Field>

      <Field id="contract-start-date" label="Start date">
        <input
          id="contract-start-date"
          name="startDate"
          type="date"
          required
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field
        id="contract-end-date"
        label="End date (optional)"
        hint={
          mode === "edit"
            ? "Clear to keep the current end date."
            : "Leave empty for an open-ended contract."
        }
      >
        <input
          id="contract-end-date"
          name="endDate"
          type="date"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          className={inputClassName}
        />
      </Field>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || typeStatus !== "ready"}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : mode === "create"
              ? "Create contract"
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
