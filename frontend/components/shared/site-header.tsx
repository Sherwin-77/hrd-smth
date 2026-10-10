"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearAuthSession,
  fetchCurrentEmployee,
  getAuthToken,
  getStoredEmployee,
  logoutRequest,
  type LoginEmployee,
} from "@/lib/api/auth";

export function useCurrentEmployee() {
  const router = useRouter();
  const [employee, setEmployee] = useState<LoginEmployee | null>(() =>
    getStoredEmployee(),
  );
  const [ready, setReady] = useState(false);

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

  return { employee, ready };
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/profile/sessions", label: "Sessions" },
];

function isActiveLink(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }
  return pathname === href;
}

interface SiteHeaderProps {
  employee: LoginEmployee | null;
  activePath: string;
}

export default function SiteHeader({ employee, activePath }: SiteHeaderProps) {
  const router = useRouter();

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

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <nav
          aria-label="Primary"
          className="flex min-w-0 items-center gap-4"
        >
          {NAV_LINKS.map((link) => {
            const isActive = isActiveLink(link.href, activePath);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 text-sm ${
                  isActive
                    ? "font-medium text-gray-900"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/profile"
            title={employee?.email ?? ""}
            className="truncate text-sm font-medium text-gray-900 hover:underline"
          >
            {employee?.name ?? "Employee"}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
