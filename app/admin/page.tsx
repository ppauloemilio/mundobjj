import Link from "next/link";
import { count, eq, isNotNull } from "drizzle-orm";
import { requireDb } from "@/db";
import {
  academies,
  academySuggestions,
  locationSuggestions,
  users,
} from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminPage() {
  await requireAdmin();
  const db = requireDb();

  const [
    [usersCount],
    [blockedUsers],
    [academiesCount],
    [blockedAcademies],
    [pendingLocations],
    [pendingAcademies],
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(users).where(isNotNull(users.blockedAt)),
    db.select({ value: count() }).from(academies),
    db
      .select({ value: count() })
      .from(academies)
      .where(isNotNull(academies.blockedAt)),
    db
      .select({ value: count() })
      .from(locationSuggestions)
      .where(eq(locationSuggestions.status, "pending")),
    db
      .select({ value: count() })
      .from(academySuggestions)
      .where(eq(academySuggestions.status, "pending")),
  ]);

  const cards = [
    {
      label: "Contas",
      value: usersCount.value,
      href: "/admin/usuarios",
      detail: `${blockedUsers.value} bloqueadas · login de praticantes e academias`,
    },
    {
      label: "Academias cadastradas",
      value: academiesCount.value,
      href: "/admin/academias",
      detail: `${academiesCount.value - blockedAcademies.value} na busca · ${blockedAcademies.value} bloqueadas`,
    },
    {
      label: "Sugestões pendentes",
      value: pendingLocations.value + pendingAcademies.value,
      href: "/admin/sugestoes",
      detail: `${pendingLocations.value} locais · ${pendingAcademies.value} academias`,
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-[var(--muted)]">
        Contas são quem faz login. Academias cadastradas aparecem na busca.
        Sugestões vêm de quem escolheu &quot;Outro&quot; em país, estado, cidade
        ou academia.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
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
      </div>
    </section>
  );
}
