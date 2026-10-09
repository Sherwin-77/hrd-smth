"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAuthToken,
  listPayrolls,
  type PayrollSummary,
} from "@/lib/api";

const PAGE_SIZE = 10;

export default function PayrollsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PayrollSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    listPayrolls(token, {
      page,
      limit: PAGE_SIZE,
      search,
      status: statusFilter || undefined,
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
  }, [router, page, search, statusFilter]);

  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);
    setPage(1);
    setSearch(searchInput.trim());
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
          <h1 className="text-xl font-semibold text-gray-900">Payrolls</h1>
          <Link
            href="/dashboard/payrolls/new"
            className="shrink-0 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Create payroll
          </Link>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {total} payroll{total === 1 ? "" : "s"} found.
        </p>
        <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="payroll-search" className="sr-only">
            Search payrolls
          </label>
          <input
            id="payroll-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by account name or number"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-700 focus:outline-none"
          />
          <label htmlFor="payroll-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="payroll-status"
            value={statusFilter}
            onChange={(event) => {
              setStatus("loading");
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-700 focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="submit"
            className="shrink-0 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Search
          </button>
        </form>
      </section>

      <section
        aria-label="Payroll results"
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white"
      >
        {status === "loading" ? (
          <p className="p-6 text-sm text-gray-600">Loading...</p>
        ) : status === "error" ? (
          <p role="alert" className="p-6 text-sm text-red-700">
            {error ?? "Could not load payrolls."}
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">No payrolls found.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th scope="col" className="px-4 py-2 font-medium">
                  Account name
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Account number
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Tax %
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
                    {row.account_name}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {row.account_number}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {row.tax_percentage}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${
                        row.status === "active"
                          ? "border-gray-300 bg-gray-100 text-gray-900"
                          : "border-gray-200 bg-white text-gray-600"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/payrolls/${row.id}`}
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
