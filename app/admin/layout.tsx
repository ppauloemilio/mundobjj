import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
          Administração
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Admin</h1>
      </div>
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin" className="font-medium underline">
          Visão geral
        </Link>
        <Link href="/admin/usuarios" className="font-medium underline">
          Usuários
        </Link>
        <Link href="/admin/academias" className="font-medium underline">
          Academias
        </Link>
        <Link href="/admin/sugestoes" className="font-medium underline">
          Sugestões
        </Link>
      </nav>
      {children}
    </main>
  );
}
