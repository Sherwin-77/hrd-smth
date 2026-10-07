"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  clearAuthSession,
  fetchEmployee,
  getAuthToken,
  type EmployeeDetail,
} from "@/lib/api";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
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
    fetchEmployee(token, params.id)
      .then((result) => {
        if (!active) return;
        setDetail(result);
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

  if (status === "loading") {
    return <p className="text-sm text-gray-600">Loading...</p>;
  }

  if (status === "error" || !detail) {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Employee</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error ?? "Could not load the employee."}
        </p>
        <Link
          href="/dashboard/employees"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Back to employees
        </Link>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">{detail.name}</h1>
        <p className="mt-1 text-sm text-gray-600">{detail.email}</p>
        <Link
          href="/dashboard/employees"
          className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Back to employees
        </Link>
      </section>

      <section
        aria-label="Employee details"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">Details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-600">Phone</dt>
            <dd className="text-gray-900">{detail.phoneNumber}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Address</dt>
            <dd className="text-gray-900">{detail.address}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Birth date</dt>
            <dd className="text-gray-900">
              {new Date(detail.birthDate).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Joined</dt>
            <dd className="text-gray-900">
              {new Date(detail.joinAt).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Left</dt>
            <dd className="text-gray-900">
              {detail.leaveAt
                ? new Date(detail.leaveAt).toLocaleDateString()
                : "-"}
            </dd>
          </div>
        </dl>
      </section>

      <section
        aria-label="Active payroll"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Active payroll
        </h2>
        {detail.activePayroll ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-600">Account name</dt>
              <dd className="text-gray-900">
                {detail.activePayroll.accountName}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Account number</dt>
              <dd className="text-gray-900">
                {detail.activePayroll.accountNumber}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Tax percentage</dt>
              <dd className="text-gray-900">
                {detail.activePayroll.taxPercentage}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            No active payroll for this employee.
          </p>
        )}
      </section>

      <section
        aria-label="Payslips"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Payslips ({detail.payslips.length})
        </h2>
        {detail.payslips.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No payslips found.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {detail.payslips.map((payslip) => (
              <li
                key={payslip.id}
                className="flex items-center justify-between gap-4 rounded-md border border-gray-200 px-3 py-2"
              >
                <span className="text-gray-900">
                  {new Date(payslip.date).toLocaleDateString()} -{" "}
                  {payslip.status}
                </span>
                <Link
                  href={`/dashboard/payslips/${payslip.id}`}
                  className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Detail
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
