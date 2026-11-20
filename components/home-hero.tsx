"use client";

import { useLocale } from "@/components/locale-provider";

export function HomeHero() {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden border-b border-[var(--line)] bg-[var(--ink)] text-[var(--paper)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(700px 280px at 15% 20%, rgba(180,35,46,0.35), transparent 60%), radial-gradient(500px 240px at 85% 10%, rgba(255,255,255,0.08), transparent 55%)",
        }}
      />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 sm:px-6 sm:py-10">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-white/55 uppercase">
          {t("homeEyebrow")}
        </p>
        <h1 className="font-display max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("homeTitle")}
        </h1>
        <p className="max-w-lg text-sm leading-6 text-white/75 sm:text-[15px] sm:leading-7">
          {t("homeSubtitle")}
        </p>
      </div>
    </section>
  );
}
