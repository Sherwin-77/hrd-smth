"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAuthToken,
  isForbidden,
  listContracts,
  listEmployees,
  listPayrolls,
  listPayslips,
} from "@/lib/api";
import { can, hasAnyView, usePermissions } from "@/lib/permissions";

interface OverviewStats {
  employeeTotal: number | null;
  payrollTotal: number | null;
  contractTotal: number | null;
  pendingPayslips: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { permissions, ready: permissionsReady } = usePermissions();
  const [stats, setStats] = useState<OverviewStats>({
    employeeTotal: null,
    payrollTotal: null,
    contractTotal: null,
    pendingPayslips: null,
  });
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    if (!permissionsReady) return;
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const tasks: Promise<number | null>[] = [
      can(permissions, "employees", "view")
        ? listEmployees(token, { page: 1, limit: 1 }).then(
            (r) => r.meta.total,
            () => null,
          )
        : Promise.resolve(null),
      can(permissions, "payrolls", "view")
        ? listPayrolls(token, { page: 1, limit: 1, status: "active" }).then(
            (r) => r.meta.total,
            () => null,
          )
        : Promise.resolve(null),
      can(permissions, "contracts", "view")
        ? listContracts(token, { page: 1, limit: 1, status: "pending" }).then(
            (r) => r.meta.total,
            () => null,
          )
        : Promise.resolve(null),
      can(permissions, "payslips", "view")
        ? listPayslips(token, { page: 1, limit: 1, status: "pending" }).then(
            (r) => r.meta.total,
            () => null,
          )
        : Promise.resolve(null),
    ];
    let active = true;
    Promise.all(tasks)
      .then(([employees, payrolls, contracts, pending]) => {
        if (!active) return;
        setStats({
          employeeTotal: employees,
          payrollTotal: payrolls,
          contractTotal: contracts,
          pendingPayslips: pending,
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
        if (!isForbidden(err)) {
          setStatus("ready");
        }
      });
    return () => {
      active = false;
    };
  }, [router, permissions, permissionsReady]);

  // Users with no view access anywhere land here from sign-in; send them
  // to their profile instead of showing a dead-end "no access" page.
  useEffect(() => {
    if (permissionsReady && !hasAnyView(permissions)) {
      router.replace("/profile");
    }
  }, [router, permissions, permissionsReady]);

  if (status === "loading" || !permissionsReady || !hasAnyView(permissions)) {
    return <p className="text-sm text-gray-600">Loading...</p>;
  }

  const cards = [
    {
      visible: can(permissions, "employees", "view"),
      label: "Employees",
      value: stats.employeeTotal === null ? "-" : String(stats.employeeTotal),
      hint: "Total employee records",
      href: "/dashboard/employees",
      linkText: "Browse all employees",
    },
    {
      visible: can(permissions, "payrolls", "view"),
      label: "Payrolls",
      value: stats.payrollTotal === null ? "-" : String(stats.payrollTotal),
      hint: "Active payrolls",
      href: "/dashboard/payrolls",
      linkText: "Browse all payrolls",
    },
    {
      visible: can(permissions, "contracts", "view"),
      label: "Pending Contracts",
      value: stats.contractTotal === null ? "-" : String(stats.contractTotal),
      hint: "Pending sign",
      href: "/dashboard/contracts",
      linkText: "Browse all contracts",
    },
    {
      visible: can(permissions, "payslips", "view"),
      label: "Payslips",
      value:
        stats.pendingPayslips === null ? "-" : String(stats.pendingPayslips),
      hint: "Awaiting approval",
      href: "/dashboard/payslips",
      linkText: "Browse all payslips",
    },
  ].filter((card) => card.visible);

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
