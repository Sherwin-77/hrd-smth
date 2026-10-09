"use client";

import { useState } from "react";
import Link from "next/link";
import type { ActionLink } from "@/lib/api";

interface ActionButtonsProps {
  actions: ActionLink[];
  editHref?: string;
  pendingId: string | null;
  error: string | null;
  onAction: (link: ActionLink, input?: string) => void;
}

export default function ActionButtons({
  actions,
  editHref,
  pendingId,
  error,
  onAction,
}: ActionButtonsProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const statusActions = actions.filter(
    (action) => action.method === "PATCH" && action.id !== "update",
  );
  const updateAction = actions.find((action) => action.id === "update");
  const deleteAction = actions.find(
    (action) => action.id === "delete" && action.method === "DELETE",
  );
  const confirmingAction =
    actions.find((action) => action.id === confirmingId) ?? null;
  const needsInput = confirmingAction?.requires_input !== undefined;
  const busy = pendingId !== null;

  function handleConfirm() {
    if (!confirmingAction) return;
    if (needsInput && !inputValue) return;
    onAction(confirmingAction, needsInput ? inputValue : undefined);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        {statusActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              if (action.requires_input) {
                setConfirmingId(action.id);
                setInputValue("");
              } else {
                onAction(action);
              }
            }}
            disabled={busy}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {pendingId === action.id ? "Saving..." : action.label}
          </button>
        ))}
        {updateAction && editHref ? (
          <Link
            href={editHref}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            {updateAction.label}
          </Link>
        ) : null}
        {deleteAction ? (
          confirmingId === deleteAction.id ? (
            <button
              type="button"
              onClick={() => setConfirmingId(null)}
              disabled={busy}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingId(deleteAction.id)}
              disabled={busy}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {deleteAction.label}
            </button>
          )
        ) : null}
      </div>
      {confirmingAction && (confirmingAction.id === "delete" || needsInput) ? (
        <div
          role="alert"
          className="rounded-md border border-gray-200 bg-white px-3 py-2"
        >
          {needsInput ? (
            <label className="block text-sm text-gray-700">
              Signed date
              <input
                type="date"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
              />
            </label>
          ) : (
            <p className="text-sm text-red-700">
              Delete this record? This cannot be undone.
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy || (needsInput && !inputValue)}
              className="rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60"
            >
              {pendingId === confirmingAction.id
                ? "Saving..."
                : `Confirm ${confirmingAction.label.toLowerCase()}`}
            </button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
