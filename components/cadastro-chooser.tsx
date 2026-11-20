"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";

export function CadastroChooser() {
  const { t } = useLocale();

  const options = [
    {
      href: "/cadastro/atleta",
      title: t("registerAthlete"),
      hint: t("registerAthleteHint"),
    },
    {
      href: "/cadastro/professor",
      title: t("registerProfessor"),
      hint: t("registerProfessorHint"),
    },
    {
      href: "/cadastro/academia",
      title: t("registerAcademy"),
      hint: t("registerAcademyHint"),
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("registerTitle")}
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
          {t("registerSubtitle")}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="ui-card p-4 transition hover:border-[var(--accent)]/40"
          >
            <h2 className="text-[15px] font-semibold tracking-tight">
              {option.title}
            </h2>
            <p className="mt-1.5 text-[12px] leading-5 text-[var(--muted)]">
              {option.hint}
            </p>
          </Link>
        ))}
      </div>
      <p className="text-[13px] text-[var(--muted)]">
        {t("registerHasAccount")}{" "}
        <Link href="/entrar" className="underline">
          {t("navEnter")}
        </Link>
      </p>
    </main>
  );
}
