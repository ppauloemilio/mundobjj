import Link from "next/link";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/session";

export const instant = false;

const nav = [
  {
    href: "/admin",
    title: "Visão geral",
    hint: "Resumo da plataforma",
  },
  {
    href: "/admin/usuarios",
    title: "Usuários",
    hint: "Contas e senhas",
  },
  {
    href: "/admin/academias",
    title: "Academias",
    hint: "Cadastro e acesso",
  },
  {
    href: "/admin/sugestoes",
    title: "Sugestões",
    hint: "Pendências de revisão",
  },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
          Administração
        </p>
        <h1 className="font-display mt-1 text-2xl font-semibold tracking-tight">
          Admin
        </h1>
      </div>
      <nav className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="ui-card group p-3.5 transition hover:border-[var(--accent)]/35"
          >
            <p className="text-[14px] font-semibold tracking-tight group-hover:text-[var(--accent)]">
              {item.title}
            </p>
            <p className="mt-1 text-[12px] text-[var(--muted)]">{item.hint}</p>
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
