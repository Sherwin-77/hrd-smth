"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  clearAuthSession,
  executeAction,
  fetchContract,
  getAuthToken,
  listContractStatuses,
  listContractTypes,
  type ActionLink,
  type ContractSummary,
} from "@/lib/api";
import { enumLabel, useEnumOptions } from "@/lib/use-enum-options";
import ActionButtons from "@/components/shared/action-buttons";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<ContractSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [signedDate, setSignedDate] = useState("");
  const { options: statusOptions, error: statusEnumError } = useEnumOptions(
    listContractStatuses,
  );
  const { options: typeOptions, error: typeEnumError } = useEnumOptions(
    listContractTypes,
  );

  useEffect(() => {
    for (const enumError of [statusEnumError, typeEnumError]) {
      if (enumError && enumError.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
    }
  }, [router, statusEnumError, typeEnumError]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    fetchContract(token, params.id)
      .then((result) => {
        if (!active) return;
        setContract(result);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof Error && err.message.includes("Session expired")) {
          clearAuthSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load.");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [router, params.id]);

  async function handleAction(link: ActionLink) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setActionPending(link.id);
    setActionError(null);
    try {
      if (link.method === "DELETE") {
        await executeAction<void>(token, link);
        router.push("/dashboard/contracts");
        return;
      }
      const result = await executeAction<ContractSummary>(token, link);
      setContract(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setActionError(
        err instanceof Error ? err.message : "Could not complete the action.",
      );
    } finally {
      setActionPending(null);
    }
  }

  async function handleSign(link: ActionLink) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setActionPending(link.id);
    setActionError(null);
    try {
      const body = signedDate ? { signed_date: signedDate } : undefined;
      const result = await executeAction<ContractSummary>(token, link, body);
      setContract(result);
      setSignedDate("");
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setActionError(
        err instanceof Error ? err.message : "Could not complete the action.",
      );
    } finally {
      setActionPending(null);
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-gray-600">Loading...</p>;
  }

  if (status === "error" || !contract) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Contract</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error ?? "Could not load the contract."}
        </p>
        <Link
          href="/dashboard/contracts"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Back to contracts
        </Link>
      </section>
    );
  }

  const signAction = contract?.available_actions?.find(
    (action) => action.id === "sign" && action.method === "PATCH",
  );
  const otherActions =
    contract?.available_actions?.filter((action) => action.id !== "sign") ?? [];

  return (
    <div className="flex flex-col gap-4">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center justify-between gap-4"
      >
        <Link
          href="/dashboard/contracts"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to contracts
        </Link>
        <ActionButtons
          actions={otherActions}
          editHref={`/dashboard/contracts/${params.id}/edit`}
          pendingId={actionPending}
          error={actionError}
          onAction={handleAction}
        />
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">
          {contract.title}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {enumLabel(typeOptions, contract.type)} -{" "}
          {enumLabel(statusOptions, contract.status)}
        </p>
      </section>

      {signAction ? (
        <section
          aria-label="Sign contract"
          className="rounded-lg border border-gray-200 bg-white p-6"
        >
          <h2 className="text-base font-semibold text-gray-900">
            Sign contract
          </h2>
          <form
            className="mt-4 flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSign(signAction);
            }}
          >
            <label
              htmlFor="signed-date"
              className="block text-sm font-medium text-gray-600"
            >
              Signed date
              <input
                id="signed-date"
                type="date"
                value={signedDate}
                onChange={(event) => setSignedDate(event.target.value)}
                className="mt-1 block rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
              />
            </label>
            <button
              type="submit"
              disabled={actionPending !== null}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"
            >
              {actionPending === signAction.id ? "Saving..." : "Sign"}
            </button>
          </form>
          <p className="mt-2 text-sm text-gray-600">
            Leave empty to use today.
          </p>
        </section>
      ) : null}

      <section
        aria-label="Contract details"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">Details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-600">Title</dt>
            <dd className="text-gray-900">{contract.title}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Type</dt>
            <dd className="text-gray-900">
              {enumLabel(typeOptions, contract.type)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Status</dt>
            <dd className="text-gray-900">
              {enumLabel(statusOptions, contract.status)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Start date</dt>
            <dd className="text-gray-900">
              {formatDate(contract.start_date)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">End date</dt>
            <dd className="text-gray-900">{formatDate(contract.end_date)}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Signed date</dt>
            <dd className="text-gray-900">
              {formatDate(contract.signed_date)}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Created</dt>
            <dd className="text-gray-900">
              {new Date(contract.created_at).toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Updated</dt>
            <dd className="text-gray-900">
              {new Date(contract.updated_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
