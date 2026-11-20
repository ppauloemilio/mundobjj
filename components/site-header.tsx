import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions/auth";

async function AuthLinks() {
  await connection();
  const session = await auth();

  if (session?.user) {
    const isAdmin =
      session.user.role === "admin" || session.user.accountType === "admin";

    return (
      <div className="flex items-center gap-3">
        {isAdmin ? (
          <Link href="/admin" className="text-sm font-medium hover:underline">
            Admin
          </Link>
        ) : (
          <Link href="/painel" className="text-sm font-medium hover:underline">
            Painel
          </Link>
        )}
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-[var(--muted)] hover:underline">
            Sair
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/entrar" className="text-sm font-medium hover:underline">
        Entrar
      </Link>
      <Link
        href="/cadastro"
        className="rounded-full bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
      >
        Criar conta
      </Link>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--card)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Mundo BJJ
        </Link>
        <Suspense
          fallback={<div className="h-9 w-28 animate-pulse rounded-full bg-[var(--line)]" />}
        >
          <AuthLinks />
        </Suspense>
      </div>
    </header>
  );
}
