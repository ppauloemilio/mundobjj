import { connection } from "next/server";
import type { ReactNode } from "react";
import { getShellSession } from "@/auth";
import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader, type HeaderAuth } from "@/components/site-header";

function panelHrefFor(accountType?: string | null) {
  if (accountType === "professor") return "/painel/professor";
  if (accountType === "academy") return "/painel/academia";
  return "/painel";
}

export async function AppShell({ children }: { children: ReactNode }) {
  await connection();
  const session = await getShellSession();
  const user = session?.user;
  const authState: HeaderAuth = {
    loggedIn: Boolean(user),
    isAdmin: user?.role === "admin" || user?.accountType === "admin",
    panelHref: panelHrefFor(user?.accountType),
  };

  return (
    <>
      <SiteHeader auth={authState} />
      <div
        className={`app-shell-main ${authState.loggedIn ? "has-bottom-nav" : ""}`}
      >
        {children}
      </div>
      <BottomNav auth={authState} />
    </>
  );
}
