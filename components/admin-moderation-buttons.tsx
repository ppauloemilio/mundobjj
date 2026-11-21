"use client";

import {
  moderationLabel,
  moderationStatus,
  type ModerationStatus,
} from "@/lib/moderation";

type Props = {
  entityId: string;
  idField: string;
  blockedAt: Date | string | null;
  suspendedAt: Date | string | null;
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
};

export function AdminModerationButtons({
  entityId,
  idField,
  blockedAt,
  suspendedAt,
  action,
  disabled,
}: Props) {
  const current = moderationStatus({ blockedAt, suspendedAt });
  const options: ModerationStatus[] = ["active", "suspended", "blocked"];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] text-[var(--muted)]">
        Moderação:{" "}
        <span className="font-semibold text-[var(--ink)]">
          {moderationLabel(current)}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((status) => (
          <form key={status} action={action}>
            <input type="hidden" name={idField} value={entityId} />
            <input type="hidden" name="status" value={status} />
            <button
              type="submit"
              disabled={disabled || current === status}
              className="min-h-11 rounded-full border border-[var(--line)] px-3 text-[12px] font-medium disabled:opacity-40"
            >
              {status === "active"
                ? "Reativar"
                : status === "suspended"
                  ? "Suspender"
                  : "Bloquear"}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
