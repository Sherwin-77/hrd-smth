"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAuthSession,
  fetchCurrentEmployeeDetail,
  getAuthToken,
  getStoredEmployee,
  type LoginEmployee,
} from "./api/auth";

export type PermissionGroup =
  "employees" | "payrolls" | "payslips" | "contracts" | "roles";

export type PermissionAction = "view" | "manage";

export const PERMISSION_GROUPS: PermissionGroup[] = [
  "employees",
  "payrolls",
  "payslips",
  "contracts",
  "roles",
];

/**
 * Client mirror of the backend rule: `<group>.manage` implies
 * `<group>.view`. Anything else needs an exact match.
 */
export function can(
  permissions: readonly string[] | null | undefined,
  group: PermissionGroup,
  action: PermissionAction,
): boolean {
  if (!permissions) return false;
  if (permissions.includes(`${group}.${action}`)) return true;
  if (action === "view") return permissions.includes(`${group}.manage`);
  return false;
}

export function hasAnyView(
  permissions: readonly string[] | null | undefined,
): boolean {
  return PERMISSION_GROUPS.some((group) => can(permissions, group, "view"));
}

/**
 * Effective permission set for the backend superadmin role. The backend
 * bypasses every authorization check for superadmins
 * (`RbacPolicy.isSuperadmin`), so the client mirrors that by granting the
 * full catalog. Derived from `PERMISSION_GROUPS`, so new groups are covered
 * automatically. This array is only ever used for `can()`/`hasAnyView()`
 * checks — never rendered.
 */
function superadminPermissions(): string[] {
  return PERMISSION_GROUPS.flatMap((group) => [
    `${group}.view`,
    `${group}.manage`,
  ]);
}

interface PermissionsState {
  permissions: string[];
  /** Identity from the same `/auth/me` response; seeded from storage. */
  employee: LoginEmployee | null;
  ready: boolean;
}

const PermissionsContext = createContext<PermissionsState>({
  permissions: [],
  employee: null,
  ready: false,
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [permissions, setPermissions] = useState<string[]>([]);
  // SSR-safe initial: `null` on both server and first client render so
  // hydration matches. The cached identity is restored in the effect below
  // (post-hydration), never during render.
  const [employee, setEmployee] = useState<LoginEmployee | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The sign-in page is public: no identity to load there. Nothing on
    // that page reads this context, so readiness stays false.
    if (pathname === "/login") {
      return;
    }
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    fetchCurrentEmployeeDetail(token)
      .then((detail) => {
        if (!active) return;
        setEmployee({
          id: detail.id,
          name: detail.name,
          email: detail.email,
        });
        setPermissions(
          detail.is_superadmin
            ? superadminPermissions()
            : (detail.permissions ?? []),
        );
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof Error && err.message.includes("Session expired")) {
          clearAuthSession();
          router.replace("/login");
          return;
        }
        // A degraded permission set fails closed: menu links and pages
        // hide rather than flashing open before an error appears. The
        // cached identity is restored here (async callback, post-hydration)
        // so the header keeps showing who is signed in instead of logging
        // the user out on a transient failure.
        setEmployee(getStoredEmployee());
        setPermissions([]);
        setReady(true);
      });
    return () => {
      active = false;
    };
  }, [router, pathname]);

  return (
    <PermissionsContext.Provider value={{ permissions, employee, ready }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsState {
  return useContext(PermissionsContext);
}

/**
 * Root-level auth boundary. Remounts the provider when crossing between
 * the public sign-in page and authenticated pages, so a sign-out/sign-in
 * as a different user never reuses the previous session's identity and
 * permissions. Within authenticated pages the provider persists, so
 * navigating dashboard ↔ profile reuses (and silently revalidates) the
 * single `/auth/me` result instead of refetching from empty.
 */
export function AuthScope({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <PermissionsProvider key={pathname === "/login" ? "public" : "authed"}>
      {children}
    </PermissionsProvider>
  );
}
