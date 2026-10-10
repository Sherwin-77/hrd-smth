"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAuthToken,
  listContracts,
  listEmployees,
  listPayrolls,
  listPayslips,
} from "@/lib/api";

interface OverviewStats {
  employeeTotal: number | null;
  payrollTotal: number | null;
  contractTotal: number | null;
  pendingPayslips: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<OverviewStats>({
    employeeTotal: null,
    payrollTotal: null,
    contractTotal: null,
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
      listEmployees(token, { page: 1, limit: 1 }),
      listPayrolls(token, { page: 1, limit: 1, status: "active" }),
      listContracts(token, { page: 1, limit: 1, status: "pending" }),
      listPayslips(token, { page: 1, limit: 1, status: "pending" }),
    ])
      .then(([employees, payrolls, contracts, pending]) => {
        setStats({
          employeeTotal: employees.meta.total,
          payrollTotal: payrolls.meta.total,
          contractTotal: contracts.meta.total,
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

  const cards = [
    {
      label: "Employees",
      value: stats.employeeTotal === null ? "-" : String(stats.employeeTotal),
      hint: "Total employee records",
      href: "/dashboard/employees",
      linkText: "Browse all employees",
    },
    {
      label: "Payrolls",
      value: stats.payrollTotal === null ? "-" : String(stats.payrollTotal),
      hint: "Active payrolls",
      href: "/dashboard/payrolls",
      linkText: "Browse all payrolls",
    },
    {
      label: "Pending Contracts",
      value: stats.contractTotal === null ? "-" : String(stats.contractTotal),
      hint: "Pending sign",
      href: "/dashboard/contracts",
      linkText: "Browse all contracts",
    },
    {
      label: "Payslips",
      value:
        stats.pendingPayslips === null ? "-" : String(stats.pendingPayslips),
      hint: "Awaiting approval",
      href: "/dashboard/payslips",
      linkText: "Browse all payslips",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="mt-1 text-sm text-gray-600">Totals across all records.</p>
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
    </div>
  );
}
