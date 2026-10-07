"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  getAuthToken,
  listSessions,
  revokeOtherSessions,
  revokeSession,
  type AuthSession,
} from "@/lib/api";

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let active = true;
    listSessions(token)
      .then((result) => {
        if (!active) return;
        setSessions(result);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof Error && err.message.includes("Session expired")) {
          clearAuthSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load.");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [router]);

  function refresh(token: string) {
    listSessions(token)
      .then((result) => {
        setSessions(result);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load.");
        setStatus("error");
      });
  }

  async function handleRevokeOne(sessionId: string) {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setAction(sessionId);
    setError(null);
    try {
      await revokeSession(token, sessionId);
      refresh(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke.");
    } finally {
      setAction(null);
    }
  }

  async function handleRevokeOthers() {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    setAction("others");
    setError(null);
    try {
      await revokeOtherSessions(token);
      refresh(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke.");
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-gray-900">Sessions</h1>
        <p className="mt-1 text-sm text-gray-600">
          Devices currently signed in to your account.
        </p>
        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleRevokeOthers}
          disabled={status !== "ready" || action !== null}
          className="mt-4 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {action === "others" ? "Signing out others..." : "Sign out other devices"}
        </button>
      </section>

      <section
        aria-label="Session list"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        {status === "loading" ? (
          <p className="text-sm text-gray-600">Loading...</p>
        ) : status === "error" && sessions.length === 0 ? (
          <p className="text-sm text-gray-600">Could not load sessions.</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-600">No active sessions.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="rounded-md border border-gray-200 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {session.userAgent ?? "Unknown device"}
                  </p>
                  {session.isCurrent ? (
                    <span className="rounded-md bg-blue-700 px-2 py-0.5 text-xs font-medium text-white">
                      Current
                    </span>
                  ) : null}
                </div>
                <dl className="mt-2 grid gap-1 text-sm text-gray-600 sm:grid-cols-2">
                  <div>
                    <dt className="font-medium">IP address</dt>
                    <dd>{session.ipAddress ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Last used</dt>
                    <dd>
                      {new Date(session.lastUsedAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Expires</dt>
                    <dd>{new Date(session.expiresAt).toLocaleString()}</dd>
                  </div>
                </dl>
                {session.isCurrent ? null : (
                  <button
                    type="button"
                    onClick={() => handleRevokeOne(session.id)}
                    disabled={action !== null}
                    className="mt-3 rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {action === session.id ? "Signing out..." : "Sign out"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
