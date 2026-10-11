"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PermissionGroup } from "./permissions";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  description: string;
  /**
   * Group `view` required to see this link (`manage` counts as `view`).
   * `null` means the link itself is always shown; the page behind it
   * degrades per card (Overview) or is self-service (Profile).
   */
  requiredView: PermissionGroup | null;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
    description: "Totals and pending approvals",
    requiredView: null,
  },
  {
    id: "employees",
    label: "Employees",
    href: "/dashboard/employees",
    description: "Search and browse employees",
    requiredView: "employees",
  },
  {
    id: "contracts",
    label: "Contracts",
    href: "/dashboard/contracts",
    description: "Employment contracts and status",
    requiredView: "contracts",
  },
  {
    id: "payrolls",
    label: "Payrolls",
    href: "/dashboard/payrolls",
    description: "Bank accounts and tax settings",
    requiredView: "payrolls",
  },
  {
    id: "payslips",
    label: "Payslips",
    href: "/dashboard/payslips",
    description: "Salary slips by period",
    requiredView: "payslips",
  },
  {
    id: "roles",
    label: "Roles",
    href: "/dashboard/roles",
    description: "Roles and permissions",
    requiredView: "roles",
  },
];

const COLLAPSED_KEY = "hr.sidebar.collapsed";

export function loadCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COLLAPSED_KEY) === "1";
}

export function saveCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
}

function getCollapsedSnapshot(): boolean {
  return loadCollapsed();
}

function getCollapsedServerSnapshot(): boolean {
  return false;
}

function subscribeCollapsed(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("hr:sidebar-collapsed", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("hr:sidebar-collapsed", onChange);
  };
}

/**
 * Persisted sidebar state as an external store. SSR and the first client
 * render both see `false` (via the server snapshot); the stored value is
 * picked up through the sanctioned `useSyncExternalStore` re-read, so there
 * is no hydration mismatch and no `setState`-in-`useEffect` involved.
 */
export function useSidebarCollapsed(): readonly [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot,
  );
  const toggleCollapsed = useCallback(() => {
    saveCollapsed(!loadCollapsed());
    window.dispatchEvent(new Event("hr:sidebar-collapsed"));
  }, []);
  return [collapsed, toggleCollapsed] as const;
}
