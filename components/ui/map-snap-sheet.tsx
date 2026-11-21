"use client";

import type { ReactNode } from "react";

export type SnapState = "closed" | "mid" | "open";

const heights: Record<SnapState, string> = {
  closed: "3.25rem",
  mid: "42vh",
  open: "78vh",
};

export function MapSnapSheet({
  state,
  onStateChange,
  title,
  countLabel,
  children,
}: {
  state: SnapState;
  onStateChange: (state: SnapState) => void;
  title: string;
  countLabel: string;
  children: ReactNode;
}) {
  function cycle() {
    const order: SnapState[] = ["closed", "mid", "open"];
    const next = order[(order.indexOf(state) + 1) % order.length];
    onStateChange(next);
  }

  return (
    <section
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-2xl border border-[var(--line)] bg-[var(--card)] shadow-[0_-8px_28px_rgba(0,0,0,0.16)] transition-[height] duration-300 ease-out sm:hidden"
      style={{ height: heights[state] }}
      aria-label={title}
    >
      <button
        type="button"
        onClick={cycle}
        className="flex min-h-11 w-full flex-col items-center justify-center gap-1 border-b border-[var(--line)] px-4"
        aria-expanded={state !== "closed"}
      >
        <span className="h-1 w-10 rounded-full bg-[var(--line)]" aria-hidden />
        <span className="flex w-full items-center justify-between text-[13px]">
          <span className="font-semibold text-[var(--ink)]">{title}</span>
          <span className="text-[var(--mute)]">{countLabel}</span>
        </span>
      </button>
      {state === "closed" ? null : (
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 safe-bottom">
          {children}
        </div>
      )}
    </section>
  );
}
