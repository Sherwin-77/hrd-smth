"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ContractForm, {
  toDateInput,
  type ContractFormValues,
} from "@/components/contracts/contract-form";
import {
  clearAuthSession,
  fetchContract,
  getAuthToken,
  listContractTypes,
  updateContract,
} from "@/lib/api";
import { useEnumOptions } from "@/lib/use-enum-options";

export default function EditContractPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<ContractFormValues | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    options: typeOptions,
    status: typeStatus,
    error: typeError,
    retry: retryType,
  } = useEnumOptions(listContractTypes);

  useEffect(() => {
    if (typeError && typeError.includes("Session expired")) {
      clearAuthSession();
      router.replace("/login");
    }
  }, [router, typeError]);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    fetchContract(token, params.id)
      .then((contract) => {
        if (!active) return;
        setInitial({
          employeeId: contract.employee_id,
          type: contract.type,
          title: contract.title,
          startDate: toDateInput(contract.start_date),
          endDate: toDateInput(contract.end_date),
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

  async function handleSubmit(values: ContractFormValues) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const updated = await updateContract(token, params.id, {
        type: values.type,
        title: values.title,
        start_date: values.startDate,
        // The backend update DTO has no way to clear the end date, so an
        // empty input keeps the current value.
        ...(values.endDate ? { end_date: values.endDate } : {}),
      });
      router.push(`/dashboard/contracts/${updated.id}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setServerError(
        err instanceof Error ? err.message : "Could not update the contract.",
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
        <h1 className="text-xl font-semibold text-gray-900">Edit contract</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {loadError ?? "Could not load the contract."}
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

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <nav aria-label="Breadcrumb">
        <Link
          href={`/dashboard/contracts/${params.id}`}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to detail
        </Link>
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit contract</h1>
        <p className="mt-1 text-sm text-gray-600">{initial.title}</p>
      </section>

      <section
        aria-label="Edit contract form"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <ContractForm
          mode="edit"
          initial={initial}
          saving={saving}
          serverError={serverError}
          cancelHref={`/dashboard/contracts/${params.id}`}
          onSubmit={handleSubmit}
          typeOptions={typeOptions}
          typeStatus={typeStatus}
          typeError={typeError}
          onTypeRetry={retryType}
        />
      </section>
    </div>
  );
}
