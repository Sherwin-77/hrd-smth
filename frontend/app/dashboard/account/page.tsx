"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import {
  changePasswordRequest,
  clearAuthSession,
  fetchCurrentEmployeeDetail,
  getAuthToken,
  type EmployeeDetail,
} from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchCurrentEmployeeDetail(token)
      .then((profile) => {
        setDetail(profile);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.message.includes("Session expired")) {
          clearAuthSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load.");
        setStatus("error");
      });
  }, [router]);

  async function handleChangePassword(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!currentPassword || !newPassword) {
      setFormError("Enter your current and a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setFormError("The new password must be at least 8 characters.");
      return;
    }
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    try {
      await changePasswordRequest(token, currentPassword, newPassword);
      setFormSuccess("Password changed.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not change password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Account</h1>
        <p className="mt-1 text-sm text-gray-600">
          Your profile details and password.
        </p>
      </section>

      <section
        aria-label="Profile details"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Profile details
        </h2>
        {status === "loading" ? (
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        ) : status === "error" ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error ?? "Could not load your profile."}
          </p>
        ) : (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-600">Name</dt>
              <dd className="text-gray-900">{detail?.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Email</dt>
              <dd className="text-gray-900">{detail?.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Phone</dt>
              <dd className="text-gray-900">{detail?.phoneNumber}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Address</dt>
              <dd className="text-gray-900">{detail?.address}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Joined</dt>
              <dd className="text-gray-900">
                {detail ? new Date(detail.joinAt).toLocaleDateString() : "-"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Active payroll</dt>
              <dd className="text-gray-900">
                {detail?.activePayroll
                  ? `${detail.activePayroll.accountName} (${detail.activePayroll.accountNumber})`
                  : "None"}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section
        aria-label="Change password"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Change password
        </h2>
        <form onSubmit={handleChangePassword} className="mt-4 flex max-w-sm flex-col gap-4">
          {formError ? (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {formError}
            </p>
          ) : null}
          {formSuccess ? (
            <p
              role="status"
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900"
            >
              {formSuccess}
            </p>
          ) : null}
          <div>
            <label
              htmlFor="current-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-700 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="new-password"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-700 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Change password"}
          </button>
        </form>
      </section>
    </div>
  );
}
