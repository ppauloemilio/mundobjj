import Link from "next/link";
import { Suspense, type ReactNode } from "react";
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
    hint: "Editar, suspender, bloquear",
  },
  {
    href: "/admin/academias",
    title: "Academias",
    hint: "Sugeridas, cadastradas e acesso",
  },
  {
    href: "/admin/lojas",
    title: "Lojas",
    hint: "Cadastro e moderação",
  },
  {
    href: "/admin/sugestoes",
    title: "Sugestões",
    hint: "Locais, academias, professores",
  },
];

function AdminChrome({ children }: { children: ReactNode }) {
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
      <nav className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <AdminChrome>{children}</AdminChrome>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <AdminChrome>
          <div className="ui-card h-40 animate-pulse bg-[var(--card)]" />
        </AdminChrome>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
