import Link from "next/link";
import { count, isNotNull } from "drizzle-orm";
import { requireDb } from "@/db";
import { academies, profiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminPage() {
  await requireAdmin();
  const db = requireDb();

  const [[usersCount], [blockedUsers], [academiesCount], [blockedAcademies], [profilesCount]] =
    await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(users).where(isNotNull(users.blockedAt)),
      db.select({ value: count() }).from(academies),
      db
        .select({ value: count() })
        .from(academies)
        .where(isNotNull(academies.blockedAt)),
      db.select({ value: count() }).from(profiles),
    ]);

  const cards = [
    {
      label: "Usuários",
      value: usersCount.value,
      href: "/admin/usuarios",
      detail: `${blockedUsers.value} bloqueados`,
    },
    {
      label: "Perfis",
      value: profilesCount.value,
      href: "/admin/usuarios",
      detail: "vinculados às contas",
    },
    {
      label: "Academias",
      value: academiesCount.value,
      href: "/admin/academias",
      detail: `${blockedAcademies.value} bloqueadas`,
    },
    {
      label: "Academias ativas",
      value: academiesCount.value - blockedAcademies.value,
      href: "/admin/academias",
      detail: "visíveis na busca",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5"
        >
          <p className="text-sm text-[var(--muted)]">{card.label}</p>
          <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{card.detail}</p>
        </Link>
      ))}
    </section>
  );
}
