"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import SiteHeader, {
  useCurrentEmployee,
} from "@/components/shared/site-header";
import { usePermissions } from "@/lib/permissions";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { employee, ready } = useCurrentEmployee();
  const { permissions, ready: permissionsReady } = usePermissions();

  // Gate on `ready` alone: the shell (header + content) never renders
  // before auth resolves, so logged-out users see only `Loading...`
  // and hydration stays consistent (both sides render `Loading...` first).
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <SiteHeader
        employee={employee}
        activePath={pathname}
        permissions={permissions}
        permissionsReady={permissionsReady}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
