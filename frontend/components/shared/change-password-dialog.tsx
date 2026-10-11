"use client";

import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import {
  changePasswordRequest,
  clearAuthSession,
  getAuthToken,
} from "@/lib/api";

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ChangePasswordDialog({
  open,
  onClose,
  onSuccess,
}: ChangePasswordDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
      dialog.querySelector("input")?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClosed() {
    setCurrentPassword("");
    setNewPassword("");
    setFormError(null);
    setFormSuccess(null);
    onClose();
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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
      onSuccess?.();
      window.setTimeout(() => {
        dialogRef.current?.close();
      }, 1000);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setFormError(
        err instanceof Error ? err.message : "Could not change password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="change-password-title"
      onClose={handleClosed}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 backdrop:bg-gray-900/50"
    >
      <h2
        id="change-password-title"
        className="text-base font-semibold text-gray-900"
      >
        Change password
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
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
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={saving}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Change password"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
