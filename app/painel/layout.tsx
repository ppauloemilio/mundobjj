import Link from "next/link";
import type { ReactNode } from "react";
import { requireAppUser } from "@/lib/session";

export const instant = false;

export default async function PainelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAppUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <nav className="flex flex-wrap gap-3 text-sm">
        {user.accountType === "athlete" ? (
          <Link href="/painel" className="font-medium underline">
            Meu perfil
          </Link>
        ) : null}
        {user.accountType === "professor" ? (
          <Link href="/painel/professor" className="font-medium underline">
            Painel professor
          </Link>
        ) : null}
        {user.accountType === "academy" ? (
          <Link href="/painel/academia" className="font-medium underline">
            Minha academia
          </Link>
        ) : null}
      </nav>
      {children}
    </main>
  );
}
