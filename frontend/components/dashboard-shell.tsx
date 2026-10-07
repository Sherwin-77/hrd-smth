"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar";
import {
  clearAuthSession,
  fetchCurrentEmployee,
  getAuthToken,
  getStoredEmployee,
  logoutRequest,
  type LoginEmployee,
} from "@/lib/api";
import {
  loadCollapsed,
  saveCollapsed,
} from "@/lib/sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [employee, setEmployee] = useState<LoginEmployee | null>(() =>
    getStoredEmployee(),
  );
  const [ready, setReady] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(loadCollapsed);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchCurrentEmployee(token)
      .then((current) => {
        setEmployee(current);
        setReady(true);
      })
      .catch(() => {
        clearAuthSession();
        router.replace("/login");
      });
  }, [router]);

  const handleToggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      saveCollapsed(!prev);
      return !prev;
    });
  }, []);

  async function handleSignOut() {
    const token = getAuthToken();
    if (token) {
      try {
        await logoutRequest(token);
      } catch {
        // Session already invalid; still sign out locally.
      }
    }
    clearAuthSession();
    router.push("/login");
  }

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
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900">
                {employee?.name ?? "Employee"}
              </p>
              <p className="truncate text-xs text-gray-600">
                {employee?.email ?? ""}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="shrink-0 rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
