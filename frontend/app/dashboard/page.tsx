"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  fetchCurrentEmployee,
  getAuthToken,
  getStoredEmployee,
  logoutRequest,
  type LoginEmployee,
} from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<LoginEmployee | null>(
    () => getStoredEmployee(),
  );
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    fetchCurrentEmployee(token)
      .then((current) => {
        setEmployee(current);
        setStatus("ready");
      })
      .catch(() => {
        clearAuthSession();
        router.replace("/login");
      });
  }, [router]);

  async function handleSignOut() {
    const token = getAuthToken();
    if (token) {
      try {
        await logoutRequest(token);
      } catch {
        // Session is already invalid; still sign out locally.
      }
    }
    clearAuthSession();
    router.push("/login");
  }

  if (status === "loading" && !employee) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <p className="text-sm text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <section className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8">
        <h1 className="text-xl font-semibold text-gray-900">Welcome</h1>
        <p className="mt-1 text-sm text-gray-600">
          You are signed in as:
        </p>
        <p className="mt-4 text-sm font-medium text-gray-900">
          {employee?.name}
        </p>
        <p className="text-sm text-gray-600">{employee?.email}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Sign Out
        </button>
      </section>
    </main>
  );
}
