"use client";

import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t, pending } = useLocale();

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-[var(--line)] bg-white/80 p-0.5 backdrop-blur ${
        compact ? "" : "shadow-[0_1px_2px_rgba(15,20,25,0.04)]"
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
            className={`min-h-7 rounded-md px-2.5 text-[11px] font-semibold tracking-wide transition ${
              active
                ? "bg-[var(--ink)] text-white"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            } disabled:opacity-60`}
          >
            {code === "pt" ? t("langPt") : t("langEn")}
          </button>
        );
      })}
    </div>
  );
}
