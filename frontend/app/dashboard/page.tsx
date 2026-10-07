"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  fetchCurrentEmployeeDetail,
  getAuthToken,
  listEmployees,
  listPayslips,
  type EmployeeDetail,
} from "@/lib/api";

interface OverviewStats {
  employeeTotal: number | null;
  pendingPayslips: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [stats, setStats] = useState<OverviewStats>({
    employeeTotal: null,
    pendingPayslips: null,
  });
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
    Promise.all([
      fetchCurrentEmployeeDetail(token),
      listEmployees(token, { page: 1, limit: 1 }),
      listPayslips(token, { page: 1, limit: 1, status: "pending" }),
    ])
      .then(([profile, employees, pending]) => {
        setDetail(profile);
        setStats({
          employeeTotal: employees.meta.total,
          pendingPayslips: pending.meta.total,
        });
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

  if (status === "loading") {
    return <p className="text-sm text-gray-600">Loading...</p>;
  }

  if (status === "error") {
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error ?? "Could not load the dashboard."}
        </p>
      </section>
    );
  }

  const payslipCount = detail?.payslips.length ?? 0;
  const activePayroll = detail?.activePayroll ?? null;

  const cards = [
    {
      label: "Employees",
      value: stats.employeeTotal === null ? "-" : String(stats.employeeTotal),
      hint: "Total employee records",
      href: "/dashboard/employees",
      linkText: "Browse employees",
    },
    {
      label: "Active payroll",
      value: activePayroll ? activePayroll.accountName : "None",
      hint: activePayroll
        ? `Account ${activePayroll.accountNumber}`
        : "No active payroll on your profile",
      href: "/dashboard/payrolls",
      linkText: "View payrolls",
    },
    {
      label: "Your payslips",
      value: String(payslipCount),
      hint: "Payslips linked to your profile",
      href: "/dashboard/payslips",
      linkText: "View payslips",
    },
    {
      label: "Pending payslips",
      value:
        stats.pendingPayslips === null ? "-" : String(stats.pendingPayslips),
      hint: "Awaiting approval",
      href: "/dashboard/payslips",
      linkText: "Review pending",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-600">
          Signed in as {detail?.name ?? "Employee"} ({detail?.email ?? ""}).
        </p>
      </section>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white p-5"
          >
            <h2 className="text-sm font-medium text-gray-600">{card.label}</h2>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {card.value}
            </p>
            <p className="mt-1 text-sm text-gray-600">{card.hint}</p>
            <Link
              href={card.href}
              className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline"
            >
              {card.linkText}
            </Link>
          </div>
        ))}
      </section>

      <section
        aria-label="Profile summary"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">Your profile</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-gray-600">Name</dt>
            <dd className="text-gray-900">{detail?.name ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Email</dt>
            <dd className="text-gray-900">{detail?.email ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Phone</dt>
            <dd className="text-gray-900">{detail?.phoneNumber ?? "-"}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-600">Joined</dt>
            <dd className="text-gray-900">
              {detail ? new Date(detail.joinAt).toLocaleDateString() : "-"}
            </dd>
          </div>
        </dl>
        <Link
          href="/dashboard/account"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Manage account
        </Link>
      </section>
    </div>
  );
}
