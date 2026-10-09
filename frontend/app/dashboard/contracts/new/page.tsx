"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContractForm, {
  type ContractEmployeeOption,
  type ContractFormValues,
} from "@/components/contracts/contract-form";
import {
  clearAuthSession,
  createContract,
  getAuthToken,
  listContractTypes,
  listEmployees,
} from "@/lib/api";
import { useEnumOptions } from "@/lib/use-enum-options";

export default function NewContractPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<
    ContractEmployeeOption[]
  >([]);
  const [searchingEmployees, setSearchingEmployees] = useState(true);
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
    const timer = setTimeout(() => {
      listEmployees(token, { limit: 20, search: employeeSearch })
        .then((result) => {
          if (!active) return;
          setEmployeeOptions(
            result.data.map((row) => ({
              id: row.id,
              name: row.name,
              email: row.email,
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

  async function handleSubmit(values: ContractFormValues) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const created = await createContract(token, {
        employee_id: values.employeeId,
        type: values.type,
        title: values.title,
        start_date: values.startDate,
        ...(values.endDate ? { end_date: values.endDate } : {}),
      });
      router.push(`/dashboard/contracts/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        clearAuthSession();
        router.replace("/login");
        return;
      }
      setServerError(
        err instanceof Error ? err.message : "Could not create the contract.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <nav aria-label="Breadcrumb">
        <Link
          href="/dashboard/contracts"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Back to contracts
        </Link>
      </nav>
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">New contract</h1>
        <p className="mt-1 text-sm text-gray-600">
          Fill in the details below to add a contract.
        </p>
      </section>

      <section
        aria-label="New contract form"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <ContractForm
          mode="create"
          saving={saving}
          serverError={serverError}
          cancelHref="/dashboard/contracts"
          onSubmit={handleSubmit}
          typeOptions={typeOptions}
          typeStatus={typeStatus}
          typeError={typeError}
          onTypeRetry={retryType}
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
