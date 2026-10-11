"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface EmployeeComboboxOption {
  value: string;
  name: string;
  email: string;
  disabled?: boolean;
  disabledReason?: string;
}

interface EmployeeComboboxProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: EmployeeComboboxOption[];
  search: string;
  onSearchChange: (value: string) => void;
  searching: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
}

const buttonClassName =
  "flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-left text-sm text-gray-900 focus:border-blue-700 focus:outline-none";
const searchInputClassName =
  "w-full border-b border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-700 focus:outline-none";

function optionLabel(option: EmployeeComboboxOption): string {
  const base = `${option.name} (${option.email})`;
  if (option.disabled && option.disabledReason) {
    return `${base} ${option.disabledReason}`;
  }
  return base;
}

export default function EmployeeCombobox({
  id,
  value,
  onChange,
  options,
  search,
  onSearchChange,
  searching,
  placeholder = "Select an employee",
  searchPlaceholder = "Search employees",
}: EmployeeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = `${id}-listbox`;
  const searchId = `${id}-search`;
  const statusId = useId();

  const selected = options.find((option) => option.value === value);
  // Preserve the selected label when the current search page
  // no longer contains it. Set only on user selection, so no effect needed.
  const [selectedOption, setSelectedOption] =
    useState<EmployeeComboboxOption | null>(null);
  const visibleSelected =
    selected ??
    (selectedOption && selectedOption.value === value ? selectedOption : null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open ]);

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open ]);

  function openListbox() {
    setActiveIndex(-1);
    setOpen(true);
  }

  const enabledIndexes = options
    .map((option, index) => ({ option, index }))
    .filter(({ option }) => !option.disabled)
    .map(({ index }) => index);

  function moveActive(direction: 1 | -1) {
    if (enabledIndexes.length === 0) return;
    setActiveIndex((current) => {
      const position = enabledIndexes.indexOf(current);
      if (position === -1) {
        return direction === 1
          ? enabledIndexes[0]
          : enabledIndexes[enabledIndexes.length - 1];
      }
      const next =
        (position + direction + enabledIndexes.length) %
        enabledIndexes.length;
      return enabledIndexes[next];
    });
  }

  function chooseIndex(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    setSelectedOption(option);
    onChange(option.value);
    setOpen(false);
  }

  const buttonText = visibleSelected
    ? optionLabel(visibleSelected)
    : searching && options.length === 0
      ? "Searching..."
      : placeholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (open) {
            setOpen(false);
          } else {
            openListbox();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter") {
            event.preventDefault();
            openListbox();
          }
        }}
        className={buttonClassName}
      >
        <span
          title={visibleSelected ? buttonText : undefined}
          className={`min-w-0 flex-1 truncate ${
            visibleSelected || value ? "text-gray-900" : "text-gray-500"
          }`}
        >
          {buttonText}
        </span>
        <span aria-hidden="true" className="text-gray-500">
          ▾
        </span>
      </button>
      {open ? (
        <div className="absolute top-full right-0 left-0 z-10 mt-1 rounded-md border border-gray-200 bg-white">
          <input
            ref={searchInputRef}
            id={searchId}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={
              activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
            }
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                moveActive(1);
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                moveActive(-1);
              } else if (event.key === "Enter") {
                event.preventDefault();
                if (activeIndex >= 0) chooseIndex(activeIndex);
              } else if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
              }
            }}
            placeholder={searchPlaceholder}
            className={searchInputClassName}
          />
          <p id={statusId} role="status" className="sr-only">
            {searching
              ? "Searching employees."
              : `${options.length} employees found.`}
          </p>
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={id}
            className="max-h-60 overflow-auto py-1"
          >
            {searching && options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-600">Searching...</li>
            ) : options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-600">
                No employees found
              </li>
            ) : (
              options.map((option, index) => (
                <li
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  onMouseDown={(event) => {
                    // Select before the input blurs / popover closes.
                    event.preventDefault();
                    chooseIndex(index);
                  }}
                  onMouseEnter={() => {
                    if (!option.disabled) setActiveIndex(index);
                  }}
                  className={[
                    "px-3 py-2.5 text-sm",
                    option.disabled
                      ? "cursor-not-allowed text-gray-400"
                      : "cursor-pointer text-gray-900",
                    option.value === value ? "font-medium" : "",
                    activeIndex === index && !option.disabled
                      ? "bg-gray-100"
                      : "",
                  ].join(" ")}
                >
                  <span className="block truncate font-medium">
                    {option.name}
                    {option.disabled && option.disabledReason
                      ? ` ${option.disabledReason}`
                      : null}
                  </span>
                  <span
                    className={`block truncate text-xs ${
                      option.disabled ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {option.email}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
