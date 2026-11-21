"use client";

export function Switch({
  name,
  checked,
  defaultChecked,
  onChange,
  label,
  description,
  id,
}: {
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
}) {
  const inputId = id ?? name ?? "switch";

  return (
    <label
      htmlFor={inputId}
      className="flex min-h-11 cursor-pointer items-start justify-between gap-3"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-medium text-[var(--ink)]">{label}</span>
        {description ? (
          <span className="text-[12px] leading-5 text-[var(--mute)]">
            {description}
          </span>
        ) : null}
      </span>
      <span className="relative inline-flex shrink-0 pt-0.5">
        <input
          id={inputId}
          name={name}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={(event) => onChange?.(event.target.checked)}
        />
        <span
          aria-hidden
          className="h-7 w-12 rounded-full border border-[var(--line)] bg-[var(--line)] transition peer-checked:border-[var(--brand)] peer-checked:bg-[var(--brand)] peer-focus-visible:shadow-[var(--focus-ring)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1.5 left-1 h-5 w-5 rounded-full bg-[var(--card)] shadow transition peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
}
