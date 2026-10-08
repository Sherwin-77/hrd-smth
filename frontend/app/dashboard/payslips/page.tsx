"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAuthToken,
  listPayslips,
  type PayslipSummary,
} from "@/lib/api";

const PAGE_SIZE = 10;

export default function PayslipsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PayslipSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
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
    listPayslips(token, {
      page,
      limit: PAGE_SIZE,
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
  }, [router, page, statusFilter]);

  function changePage(next: number) {
    if (next < 1 || (totalPages > 0 && next > totalPages)) return;
    setStatus("loading");
    setPage(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Payslips</h1>
        <p className="mt-1 text-sm text-gray-600">
          {total} payslip{total === 1 ? "" : "s"} found.
        </p>
        <form
          onSubmit={(event) => event.preventDefault()}
          className="mt-4 flex gap-2"
        >
          <label htmlFor="payslip-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="payslip-status"
            value={statusFilter}
            onChange={(event) => {
              setStatus("loading");
              setPage(1);
              setStatusFilter(event.target.value);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-700 focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </form>
      </section>

      <section
        aria-label="Payslip results"
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white"
      >
        {status === "loading" ? (
          <p className="p-6 text-sm text-gray-600">Loading...</p>
        ) : status === "error" ? (
          <p role="alert" className="p-6 text-sm text-red-700">
            {error ?? "Could not load payslips."}
          </p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">No payslips found.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th scope="col" className="px-4 py-2 font-medium">
                  Date
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Basic
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Overtime
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Bonus
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Tax
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Deduction
                </th>
                <th scope="col" className="px-4 py-2 font-medium">
                  Net
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
                    {new Date(row.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{row.basic_salary}</td>
                  <td className="px-4 py-2 text-gray-700">{row.overtime}</td>
                  <td className="px-4 py-2 text-gray-700">{row.bonus}</td>
                  <td className="px-4 py-2 text-gray-700">{row.tax}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {row.deduction}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {row.total}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-block rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/payslips/${row.id}`}
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
