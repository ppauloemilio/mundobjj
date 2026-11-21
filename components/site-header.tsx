"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { useLocale } from "@/components/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomSheet } from "@/components/ui/bottom-sheet";

export type HeaderAuth = {
  loggedIn: boolean;
  isAdmin: boolean;
  panelHref: string;
};

export function SiteHeader({ auth }: { auth: HeaderAuth }) {
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 640) setMenuOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link
            href="/"
            className="font-display text-[15px] font-semibold tracking-tight text-[var(--ink)]"
          >
            {t("brand")}
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-2.5 sm:flex">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <DesktopAuth auth={auth} />
          </div>

          {/* Mobile */}
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--line)] text-[13px] font-semibold text-[var(--ink)] sm:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? t("menuClose") : t("menuOpen")}
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden className="flex flex-col gap-1">
              <span className="block h-0.5 w-4 rounded bg-[var(--ink)]" />
              <span className="block h-0.5 w-4 rounded bg-[var(--ink)]" />
              <span className="block h-0.5 w-4 rounded bg-[var(--ink)]" />
            </span>
          </button>
        </div>
      </header>

      <BottomSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t("brand")}
      >
        <div id={menuId} className="flex flex-col gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <MobileAuth auth={auth} onNavigate={() => setMenuOpen(false)} />
        </div>
      </BottomSheet>
    </>
  );
}

function DesktopAuth({ auth }: { auth: HeaderAuth }) {
  const { t } = useLocale();

  if (auth.loggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-[13px] font-medium text-[var(--ink)]/80 hover:text-[var(--ink)]"
        >
          {t("navHome")}
        </Link>
        <Link
          href={auth.isAdmin ? "/admin" : auth.panelHref}
          className="text-[13px] font-medium text-[var(--ink)]/80 hover:text-[var(--ink)]"
        >
          {auth.isAdmin ? t("navAdmin") : t("navPanel")}
        </Link>
        <LogoutButton className="min-h-11 text-[13px] text-[var(--mute)] hover:text-[var(--ink)]">
          {t("navLogout")}
        </LogoutButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href="/entrar"
        className="text-[13px] font-medium text-[var(--ink)]/80 hover:text-[var(--ink)]"
      >
        {t("navEnter")}
      </Link>
      <Link
        href="/cadastro"
        className="ui-btn ui-btn-primary inline-flex items-center"
      >
        {t("navRegister")}
      </Link>
    </div>
  );
}

function MobileAuth({
  auth,
  onNavigate,
}: {
  auth: HeaderAuth;
  onNavigate: () => void;
}) {
  const { t } = useLocale();

  if (auth.loggedIn) {
    return (
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex min-h-11 items-center rounded-xl border border-[var(--line)] px-3 text-[14px] font-medium"
        >
          {t("navHome")}
        </Link>
        <Link
          href={auth.isAdmin ? "/admin" : auth.panelHref}
          onClick={onNavigate}
          className="flex min-h-11 items-center rounded-xl border border-[var(--line)] px-3 text-[14px] font-medium"
        >
          {auth.isAdmin ? t("navAdmin") : t("navPanel")}
        </Link>
        <LogoutButton className="flex min-h-11 w-full items-center rounded-xl border border-[var(--line)] px-3 text-left text-[14px] text-[var(--mute)]">
          {t("navLogout")}
        </LogoutButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Link
        href="/entrar"
        onClick={onNavigate}
        className="flex min-h-11 items-center rounded-xl border border-[var(--line)] px-3 text-[14px] font-medium"
      >
        {t("navEnter")}
      </Link>
      <Link
        href="/cadastro"
        onClick={onNavigate}
        className="ui-btn ui-btn-primary inline-flex w-full items-center justify-center"
      >
        {t("navRegister")}
      </Link>
    </div>
  );
}
