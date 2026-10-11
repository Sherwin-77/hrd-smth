"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAuthToken,
  logoutRequest,
  type LoginEmployee,
} from "@/lib/api/auth";
import { hasAnyView, usePermissions } from "@/lib/permissions";

/**
 * Identity from the shared `PermissionsProvider` (`/auth/me`, fetched
 * once). Callers must render under a lifted provider (root layout).
 */
export function useCurrentEmployee() {
  const { employee, ready } = usePermissions();
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
  /**
   * When provided (dashboard pages), the Dashboard link hides once
   * permissions resolve and the user has no view access. Omitted on
   * profile pages, where the link always shows.
   */
  permissions?: string[];
  permissionsReady?: boolean;
}

export default function SiteHeader({
  employee,
  activePath,
  permissions,
  permissionsReady,
}: SiteHeaderProps) {
  const router = useRouter();
  const links = NAV_LINKS.filter((link) => {
    if (link.href !== "/dashboard") return true;
    if (permissions === undefined || !permissionsReady) return true;
    return hasAnyView(permissions);
  });

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
        <nav aria-label="Primary" className="flex min-w-0 items-center gap-4">
          {links.map((link) => {
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
