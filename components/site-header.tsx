import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";

async function AuthLinks() {
  await connection();
  const session = await auth();
  const locale = await getRequestLocale();

  if (session?.user) {
    const isAdmin =
      session.user.role === "admin" || session.user.accountType === "admin";

    return (
      <div className="flex items-center gap-2.5 sm:gap-3">
        {isAdmin ? (
          <Link
            href="/admin"
            className="text-[13px] font-medium text-[var(--ink)]/80 hover:text-[var(--ink)]"
          >
            {t(locale, "navAdmin")}
          </Link>
        ) : (
          <Link
            href="/painel"
            className="text-[13px] font-medium text-[var(--ink)]/80 hover:text-[var(--ink)]"
          >
            {t(locale, "navPanel")}
          </Link>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-[13px] text-[var(--muted)] hover:text-[var(--ink)]"
          >
            {t(locale, "navLogout")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <Link
        href="/entrar"
        className="text-[13px] font-medium text-[var(--ink)]/80 hover:text-[var(--ink)]"
      >
        {t(locale, "navEnter")}
      </Link>
      <Link
        href="/cadastro"
        className="ui-btn ui-btn-primary inline-flex items-center"
      >
        {t(locale, "navRegister")}
      </Link>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link
          href="/"
          className="font-display text-[15px] font-semibold tracking-tight text-[var(--ink)]"
        >
          Mundo BJJ
        </Link>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <LanguageSwitcher compact />
          <Suspense
            fallback={
              <div className="h-8 w-24 animate-pulse rounded-full bg-[var(--line)]" />
            }
          >
            <AuthLinks />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
