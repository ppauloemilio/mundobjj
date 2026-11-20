"use client";

import { LoginForm } from "@/components/auth-form";
import { useLocale } from "@/components/locale-provider";

export function LoginPage() {
  const { t } = useLocale();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("loginTitle")}
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
          {t("loginSubtitle")}
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
