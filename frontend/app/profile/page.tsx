"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAuthSession,
  fetchCurrentEmployeeDetail,
  getAuthToken,
  listContractStatuses,
  listContractTypes,
  listPayrollStatuses,
  listPayslipStatuses,
  type EmployeeDetail,
} from "@/lib/api";
import { enumLabel, useEnumOptions } from "@/lib/use-enum-options";
import ChangePasswordDialog from "@/components/shared/change-password-dialog";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function ProfilePage() {
  const router = useRouter();
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  // Enum labels are best-effort here: these endpoints require `*.view`,
  // so `enumLabel` falls back to the raw value for plain employees.
  const { options: payrollStatusOptions } = useEnumOptions(listPayrollStatuses);
  const { options: contractTypeOptions } = useEnumOptions(listContractTypes);
  const { options: contractStatusOptions } =
    useEnumOptions(listContractStatuses);
  const { options: payslipStatusOptions } = useEnumOptions(listPayslipStatuses);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchCurrentEmployeeDetail(token)
      .then((profile) => {
        setDetail(profile);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.message.includes("Session expired")) {
          clearAuthSession();
          router.replace("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load.");
        setStatus("error");
      });
  }, [router]);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
            <p className="mt-1 text-sm text-gray-600">
              Your employment details.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPasswordNotice(null);
              setDialogOpen(true);
            }}
            className="shrink-0 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Change password
          </button>
        </div>
        {passwordNotice ? (
          <p
            role="status"
            className="mt-4 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900"
          >
            {passwordNotice}
          </p>
        ) : null}
      </section>

      <ChangePasswordDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => setPasswordNotice("Password changed.")}
      />

      <section
        aria-label="Profile details"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Profile details
        </h2>
        {status === "loading" ? (
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        ) : status === "error" ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error ?? "Could not load your profile."}
          </p>
        ) : (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-600">Name</dt>
              <dd className="text-gray-900">{detail?.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Email</dt>
              <dd className="text-gray-900">{detail?.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Phone</dt>
              <dd className="text-gray-900">{detail?.phone_number}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Address</dt>
              <dd className="text-gray-900">{detail?.address}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Birth date</dt>
              <dd className="text-gray-900">
                {detail ? formatDate(detail.birth_date) : "-"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Joined</dt>
              <dd className="text-gray-900">
                {detail ? formatDate(detail.join_at) : "-"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Left</dt>
              <dd className="text-gray-900">
                {detail?.leave_at ? formatDate(detail.leave_at) : "-"}
              </dd>
            </div>
          </dl>
        )}
      </section>

      <section
        aria-label="Active payroll"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Active payroll
        </h2>
        {status === "loading" ? (
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        ) : status === "error" ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error ?? "Could not load your profile."}
          </p>
        ) : detail?.active_payroll ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-gray-600">Account name</dt>
              <dd className="text-gray-900">
                {detail.active_payroll.account_name}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Account number</dt>
              <dd className="text-gray-900">
                {detail.active_payroll.account_number}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Tax percentage</dt>
              <dd className="text-gray-900">
                {detail.active_payroll.tax_percentage * 100}%
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-600">Status</dt>
              <dd className="text-gray-900">
                {enumLabel(payrollStatusOptions, detail.active_payroll.status)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-gray-600">No active payroll.</p>
        )}
      </section>

      <section
        aria-label="Contracts"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Contracts ({detail?.contracts.length ?? 0})
        </h2>
        {status === "loading" ? (
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        ) : status === "error" ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error ?? "Could not load your profile."}
          </p>
        ) : !detail || detail.contracts.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No contracts found.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {detail.contracts.map((contract) => (
              <li
                key={contract.id}
                className="rounded-md border border-gray-200 px-3 py-2"
              >
                <p className="font-medium text-gray-900">{contract.title}</p>
                <p className="mt-1 text-gray-600">
                  {enumLabel(contractTypeOptions, contract.type)} -{" "}
                  {enumLabel(contractStatusOptions, contract.status)}
                </p>
                <p className="mt-1 text-gray-600">
                  {formatDate(contract.start_date)} -{" "}
                  {contract.end_date
                    ? formatDate(contract.end_date)
                    : "Present"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-label="Payslips"
        className="rounded-lg border border-gray-200 bg-white p-6"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Payslips ({detail?.payslips.length ?? 0})
        </h2>
        {status === "loading" ? (
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        ) : status === "error" ? (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error ?? "Could not load your profile."}
          </p>
        ) : !detail || detail.payslips.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No payslips found.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {detail.payslips.map((payslip) => (
              <li
                key={payslip.id}
                className="rounded-md border border-gray-200 px-3 py-2"
              >
                <details>
                  <summary className="cursor-pointer text-gray-900">
                    {formatDate(payslip.date)} -{" "}
                    {enumLabel(payslipStatusOptions, payslip.status)} -{" "}
                    {payslip.total}
                  </summary>
                  <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="font-medium text-gray-600">
                        Basic salary
                      </dt>
                      <dd className="text-gray-900">{payslip.basic_salary}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-600">Overtime</dt>
                      <dd className="text-gray-900">{payslip.overtime}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-600">Bonus</dt>
                      <dd className="text-gray-900">{payslip.bonus}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-600">Tax</dt>
                      <dd className="text-gray-900">{payslip.tax}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-600">Deduction</dt>
                      <dd className="text-gray-900">{payslip.deduction}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-600">Net pay</dt>
                      <dd className="font-medium text-gray-900">
                        {payslip.total}
                      </dd>
                    </div>
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
