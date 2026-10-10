"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import SiteHeader, { useCurrentEmployee } from "@/components/shared/site-header";

export default function ProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { employee, ready } = useCurrentEmployee();

  if (!ready && !employee) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <SiteHeader employee={employee} activePath={pathname} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
