"use client";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t, pending } = useLocale();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-[var(--line)] bg-[var(--card)] p-0.5 ${
        compact ? "" : "w-full justify-center shadow-[var(--shadow)]"
      }`}
      role="group"
      aria-label={t("langLabel")}
    >
      {(["pt", "en"] as Locale[]).map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            disabled={pending}
            onClick={() => setLocale(code)}
            className={`min-h-11 rounded-md px-3 text-[12px] font-semibold tracking-wide transition ${
              active
                ? "bg-[var(--ink)] text-[var(--bg)]"
                : "text-[var(--mute)] hover:text-[var(--ink)]"
            } disabled:opacity-60`}
          >
            {code === "pt" ? t("langPt") : t("langEn")}
          </button>
        );
      })}
    </div>
  );
}
