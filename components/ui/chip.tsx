"use client";

import type { ReactNode } from "react";

export function Chip({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-[12px] font-medium transition ${
        active
          ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]"
          : "border-[var(--line)] bg-[var(--card)] text-[var(--mute)] hover:text-[var(--ink)]"
      } disabled:opacity-50`}
    >
      {children}
    </button>
  );
}
