"use client";

import type { ReactNode } from "react";

export type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`min-h-11 rounded-lg px-3 text-[13px] font-semibold transition ${
              active
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "bg-transparent text-[var(--mute)] hover:text-[var(--ink)]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
