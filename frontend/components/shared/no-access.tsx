"use client";

import Link from "next/link";

interface NoAccessProps {
  title: string;
  message?: string;
  backHref: string;
  backLabel: string;
}

export default function NoAccess({
  title,
  message,
  backHref,
  backLabel,
}: NoAccessProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <p role="alert" className="mt-4 text-sm text-gray-600">
        {message ?? "You do not have access to this page."}
      </p>
      <Link
        href={backHref}
        className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
      >
        {backLabel}
      </Link>
    </section>
  );
}
