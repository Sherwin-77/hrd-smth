"use client";

import { useCallback, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/shared/sidebar";
import SiteHeader, { useCurrentEmployee } from "@/components/shared/site-header";
import {
  loadCollapsed,
  saveCollapsed,
} from "@/lib/sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { employee, ready } = useCurrentEmployee();
  const [collapsed, setCollapsed] = useState<boolean>(loadCollapsed);

  const handleToggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      saveCollapsed(!prev);
      return !prev;
    });
  }, []);

  if (!ready && !employee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        activePath={pathname}
        collapsed={collapsed}
        onToggleCollapsed={handleToggleCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader employee={employee} activePath={pathname} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
