"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";

export interface EmployeeFormValues {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  address: string;
  sex: "male" | "female";
  birthDate: string;
  joinAt: string;
  leaveAt: string;
}

interface EmployeeFormProps {
  mode: "create" | "edit";
  initial?: Partial<EmployeeFormValues>;
  saving: boolean;
  serverError: string | null;
  cancelHref: string;
  onSubmit: (values: EmployeeFormValues) => void;
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

export default function EmployeeForm({
  mode,
  initial,
  saving,
  serverError,
  cancelHref,
  onSubmit,
}: EmployeeFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [sex, setSex] = useState<"male" | "female">(initial?.sex ?? "male");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [joinAt, setJoinAt] = useState(initial?.joinAt ?? "");
  const [leaveAt, setLeaveAt] = useState(initial?.leaveAt ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (
      !name.trim() ||
      !email.trim() ||
      !phoneNumber.trim() ||
      !address.trim() ||
      !birthDate ||
      !joinAt
    ) {
      setFormError("Fill in all required fields.");
      return;
    }
    if (mode === "create" && !password) {
      setFormError("Set a password of at least 8 characters.");
      return;
    }
    if (password && password.length < 8) {
      setFormError("The password must be at least 8 characters.");
      return;
    }

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      password,
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      sex,
      birthDate,
      joinAt,
      leaveAt,
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

      <Field id="employee-name" label="Name">
        <input
          id="employee-name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Full name"
          className={inputClassName}
        />
      </Field>

      <Field id="employee-email" label="Email">
        <input
          id="employee-email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          className={inputClassName}
        />
      </Field>

      <Field
        id="employee-password"
        label="Password"
        hint={
          mode === "create"
            ? "At least 8 characters."
            : "Leave empty to keep the current password."
        }
      >
        <input
          id="employee-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required={mode === "create"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={
            mode === "create" ? "Set a password" : "New password (optional)"
          }
          className={inputClassName}
        />
      </Field>

      <Field id="employee-phone" label="Phone number">
        <input
          id="employee-phone"
          name="phoneNumber"
          type="tel"
          required
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="Phone number"
          className={inputClassName}
        />
      </Field>

      <Field id="employee-address" label="Address">
        <input
          id="employee-address"
          name="address"
          type="text"
          required
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Address"
          className={inputClassName}
        />
      </Field>

      <Field id="employee-sex" label="Sex">
        <select
          id="employee-sex"
          name="sex"
          value={sex}
          onChange={(event) =>
            setSex(event.target.value as "male" | "female")
          }
          className={inputClassName}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </Field>

      <Field id="employee-birth-date" label="Birth date">
        <input
          id="employee-birth-date"
          name="birthDate"
          type="date"
          required
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field id="employee-join-at" label="Join date">
        <input
          id="employee-join-at"
          name="joinAt"
          type="date"
          required
          value={joinAt}
          onChange={(event) => setJoinAt(event.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field
        id="employee-leave-at"
        label="Leave date (optional)"
        hint={
          mode === "edit"
            ? "Clear to remove the leave date."
            : "Leave empty if the employee is still active."
        }
      >
        <input
          id="employee-leave-at"
          name="leaveAt"
          type="date"
          value={leaveAt}
          onChange={(event) => setLeaveAt(event.target.value)}
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
              ? "Create employee"
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
