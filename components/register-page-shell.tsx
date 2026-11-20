"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";
import type { MessageKey } from "@/lib/i18n/messages";

export function RegisterPageShell({
  titleKey,
  subtitleKey,
  children,
}: {
  titleKey: MessageKey;
  subtitleKey: MessageKey;
  children: ReactNode;
}) {
  const { t } = useLocale();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t(titleKey)}
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">{t(subtitleKey)}</p>
      </div>
      {children}
    </main>
  );
}
