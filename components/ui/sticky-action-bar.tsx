"use client";

import type { ReactNode } from "react";

export function StickyActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky-action-bar">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-end gap-2 px-4 py-3 sm:px-6 safe-bottom">
        {children}
      </div>
    </div>
  );
}
