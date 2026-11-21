"use client";

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";
import { useLocale } from "@/components/locale-provider";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[88dvh] w-full max-w-none rounded-t-2xl border border-[var(--line)] bg-[var(--card)] p-0 text-[var(--ink)] shadow-[0_-8px_32px_rgba(0,0,0,0.18)] open:flex open:flex-col backdrop:bg-black/45"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <h2 id={titleId} className="font-display text-[15px] font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="ui-btn min-h-11 px-3 text-[13px] text-[var(--mute)]"
          aria-label={t("close")}
        >
          ✕
        </button>
      </div>
      <div className="overflow-y-auto px-4 py-4 safe-bottom">{children}</div>
    </dialog>
  );
}
