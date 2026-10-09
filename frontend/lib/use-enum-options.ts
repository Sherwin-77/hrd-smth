"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthToken, type EnumOption } from "./api";

export type EnumFetchStatus = "loading" | "ready" | "error";

export interface EnumOptionsState {
  options: EnumOption[] | null;
  status: EnumFetchStatus;
  error: string | null;
  retry: () => void;
}

/**
 * Fetch enum options from the backend (source of truth).
 * No hardcoded fallback: loading disables controls, error exposes
 * retry. 401 surfaces as "Session expired..." so callers can redirect
 * to /login like every other fetch.
 */
export function useEnumOptions(
  fetcher: (token: string) => Promise<EnumOption[]>,
): EnumOptionsState {
  const [options, setOptions] = useState<EnumOption[] | null>(null);
  const [status, setStatus] = useState<EnumFetchStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setStatus("loading");
    setError(null);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const token = getAuthToken();
    const task = token
      ? fetcher(token)
      : Promise.reject(
          new Error("Session expired. Please sign in again."),
        );
    task
      .then((result) => {
        if (!active) return;
        setOptions(result);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load.");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [fetcher, attempt]);

  return { options, status, error, retry };
}

/** Resolve a display label; raw value passthrough when options are missing. */
export function enumLabel(
  options: EnumOption[] | null,
  value: string,
): string {
  return options?.find((option) => option.value === value)?.label ?? value;
}
