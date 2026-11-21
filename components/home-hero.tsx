"use client";

import { useLocale } from "@/components/locale-provider";

export function HomeHero() {
  const { t } = useLocale();

  return (
    <section className="border-b border-[var(--line)] bg-[var(--hero)] text-[#f1f0f4]">
      <div className="mx-auto flex max-h-[120px] w-full max-w-5xl flex-col justify-center gap-1 px-4 py-4 sm:px-6">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-white/50 uppercase">
          {t("homeEyebrow")}
        </p>
        <h1 className="font-display text-[22px] leading-tight font-semibold tracking-tight sm:text-2xl">
          {t("homeTitle")}
        </h1>
        <p className="line-clamp-1 text-[12px] text-white/70 sm:text-[13px]">
          {t("homeSubtitle")}
        </p>
      </div>
    </section>
  );
}
