"use client";

interface FormSelectProps {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  variant?: "form" | "filter";
  children: React.ReactNode;
}

export default function FormSelect({
  id,
  name,
  value,
  onChange,
  disabled,
  required,
  variant = "form",
  children,
}: FormSelectProps) {
  return (
    <div
      className={`relative ${variant === "form" ? "w-full" : "w-auto min-w-[160px]"}`}
    >
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-md border border-gray-300 bg-white py-2.5 pr-8 pl-3 text-sm text-gray-900 focus:border-blue-700 focus:outline-none disabled:opacity-60"
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
      >
        ▾
      </span>
    </div>
  );
}
