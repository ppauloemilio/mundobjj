"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LogoutButton } from "@/components/logout-button";
import { useLocale } from "@/components/locale-provider";
import type { HeaderAuth } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomSheet } from "@/components/ui/bottom-sheet";

export function BottomNav({ auth }: { auth: HeaderAuth }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!auth.loggedIn) return null;

  const profileHref = auth.isAdmin ? "/admin" : auth.panelHref;
  const searchActive = pathname === "/";
  const profileActive =
    pathname.startsWith("/painel") || pathname.startsWith("/admin");

  return (
    <>
      <nav className="bottom-nav safe-bottom" aria-label={t("navMore")}>
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-1 px-2 py-1.5">
          <NavItem href="/" label={t("navSearch")} active={searchActive} />
          <NavItem
            href={profileHref}
            label={auth.isAdmin ? t("navAdmin") : t("navProfile")}
            active={profileActive}
          />
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-semibold text-[var(--mute)]"
            aria-pressed={moreOpen}
          >
            {t("navMore")}
          </button>
        </div>
      </nav>

      <BottomSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title={t("navMore")}
      >
        <div className="flex flex-col gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <LogoutButton className="flex min-h-11 w-full items-center rounded-xl border border-[var(--line)] px-3 text-left text-[14px] text-[var(--mute)]">
            {t("navLogout")}
          </LogoutButton>
        </div>
      </BottomSheet>
    </>
  );
}

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-11 flex-col items-center justify-center rounded-lg text-[11px] font-semibold ${
        active ? "text-[var(--brand)]" : "text-[var(--mute)]"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
