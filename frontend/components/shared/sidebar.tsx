"use client";

import Link from "next/link";
import { NAV_ITEMS } from "@/lib/sidebar";

interface SidebarProps {
  activePath: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({
  activePath,
  collapsed,
  onToggleCollapsed,
}: SidebarProps) {
  return (
    <aside
      aria-label="Dashboard navigation"
      className={`flex shrink-0 flex-col border-r border-gray-200 bg-white ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        {collapsed ? (
          <span className="text-sm font-semibold text-gray-900">HR</span>
        ) : (
          <span className="text-sm font-semibold text-gray-900">HR System</span>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      <nav aria-label="Sections" className="flex-1 overflow-y-auto p-2">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? activePath === "/dashboard"
                : activePath === item.href ||
                  activePath.startsWith(`${item.href}/`);
            if (collapsed) {
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    title={item.label}
                    aria-label={item.label}
                    aria-current={isActive ? "page" : undefined}
                    className={`block rounded-md px-2 py-2 text-center text-sm font-medium ${
                      isActive
                        ? "bg-blue-700 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label.slice(0, 1)}
                  </Link>
                </li>
              );
            }
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm ${
                    isActive
                      ? "bg-blue-700 font-medium text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
