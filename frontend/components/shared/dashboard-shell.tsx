"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/shared/sidebar";
import SiteHeader, {
  useCurrentEmployee,
} from "@/components/shared/site-header";
import { usePermissions } from "@/lib/permissions";
import { useSidebarCollapsed } from "@/lib/sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { employee, ready } = useCurrentEmployee();
  const { permissions, ready: permissionsReady } = usePermissions();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  if (!ready) {
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
        onToggleCollapsed={toggleCollapsed}
        permissions={permissions}
        permissionsReady={permissionsReady}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader
          employee={employee}
          activePath={pathname}
          permissions={permissions}
          permissionsReady={permissionsReady}
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
          {permissionsReady ? (
            children
          ) : (
            <p className="text-sm text-gray-600">Loading...</p>
          )}
        </main>
      </div>
    </div>
  );
}
