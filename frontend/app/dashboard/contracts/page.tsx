"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAuthToken,
  listContracts,
  listContractStatuses,
  listContractTypes,
  type ContractSummary,
} from "@/lib/api";
import { enumLabel, useEnumOptions } from "@/lib/use-enum-options";

const PAGE_SIZE = 10;

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  enumStatus,
  enumError,
  retry,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[] | null;
  enumStatus: "loading" | "ready" | "error";
  enumError: string | null;
  retry: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={enumStatus !== "ready"}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-700 focus:outline-none disabled:opacity-60"
      >
        {enumStatus !== "ready" ? (
          <option value="">
            {enumStatus === "loading" ? "Loading..." : "Could not load options"}
          </option>
        ) : (
          <>
            <option value="">All {label.toLowerCase()}</option>
            {(options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>
      {enumStatus === "error" ? (
        <p role="alert" className="text-sm text-red-700">
          {enumError ?? "Could not load options."}{" "}
          <button
            type="button"
            onClick={retry}
            className="font-medium text-blue-700 hover:underline"
          >
            Retry
          </button>
        </p>
      ) : null}
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function ContractsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ContractSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const {
    options: statusOptions,
    status: statusEnumStatus,
    error: statusEnumError,
    retry: retryStatusEnum,
  } = useEnumOptions(listContractStatuses);
  const {
    options: typeOptions,
    status: typeEnumStatus,
    error: typeEnumError,
    retry: retryTypeEnum,
  } = useEnumOptions(listContractTypes);

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
    listContracts(token, {
      page,
      limit: PAGE_SIZE,
      status: statusFilter || undefined,
      type: typeFilter || undefined,
    })
      .then((result) => {
        if (!active) return;
        setRows(result.data);
        setTotal(result.meta.total);
        setTotalPages(result.meta.total_pages);
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
  }, [router, page, statusFilter, typeFilter]);

  function handleFilterChange(setter: (value: string) => void) {
    return (value: string) => {
      setStatus("loading");
      setPage(1);
      setter(value);
    };
  }

  function changePage(next: number) {
    if (next < 1 || (totalPages > 0 && next > totalPages)) return;
    setStatus("loading");
    setPage(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Contracts</h1>
          <Link
            href="/dashboard/contracts/new"
            className="shrink-0 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Create contract
          </Link>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {total} contract{total === 1 ? "" : "s"} found.
        </p>
        <div className="mt-4 flex gap-2">
          <FilterSelect
            id="contract-status"
            label="Filter by status"
            value={statusFilter}
            onChange={handleFilterChange(setStatusFilter)}
            options={statusOptions}
            enumStatus={statusEnumStatus}
            enumError={statusEnumError}
            retry={retryStatusEnum}
          />
          <FilterSelect
            id="contract-type"
            label="Filter by type"
            value={typeFilter}
            onChange={handleFilterChange(setTypeFilter)}
            options={typeOptions}
            enumStatus={typeEnumStatus}
            enumError={typeEnumError}
            retry={retryTypeEnum}
          />
        </div>
      </section>

      <section
        aria-label="Contract results"
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white"
      >
        {status === "loading" ? (
          <p className="p-6 text-sm text-gray-600">Loading...</p>
        ) : status === "error" ? (
          <p role="alert" className="p-6 text-sm text-red-700">
            {error ?? "Could not load contracts."}
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">No contracts found.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th scope="col" className="px-4 py-2 font-medium">
                  Title
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Type
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Start
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  End
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Signed
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {row.title}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {enumLabel(typeOptions, row.type)}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {formatDate(row.start_date)}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {formatDate(row.end_date)}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {formatDate(row.signed_date)}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
                      {enumLabel(statusOptions, row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/contracts/${row.id}`}
                      className="inline-block rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="flex items-center justify-between text-sm">
        <p className="text-gray-600">
          Page {totalPages === 0 ? 0 : page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={page <= 1 || status === "loading"}
            className="rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={totalPages === 0 || page >= totalPages || status === "loading"}
            className="rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
