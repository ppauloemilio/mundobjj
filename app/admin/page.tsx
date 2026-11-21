import Link from "next/link";
import { count, eq, isNotNull, or } from "drizzle-orm";
import { requireDb } from "@/db";
import {
  academies,
  academyAccessRequests,
  academySuggestions,
  businesses,
  locationSuggestions,
  professorSuggestions,
  users,
} from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminPage() {
  await requireAdmin();
  const db = requireDb();

  const [
    [usersCount],
    [restrictedUsers],
    [academiesCount],
    [restrictedAcademies],
    [businessesCount],
    [restrictedBusinesses],
    [pendingLocations],
    [pendingAcademies],
    [pendingProfessors],
    [pendingAccess],
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db
      .select({ value: count() })
      .from(users)
      .where(or(isNotNull(users.blockedAt), isNotNull(users.suspendedAt))),
    db.select({ value: count() }).from(academies),
    db
      .select({ value: count() })
      .from(academies)
      .where(
        or(isNotNull(academies.blockedAt), isNotNull(academies.suspendedAt)),
      ),
    db.select({ value: count() }).from(businesses),
    db
      .select({ value: count() })
      .from(businesses)
      .where(
        or(
          isNotNull(businesses.blockedAt),
          isNotNull(businesses.suspendedAt),
        ),
      ),
    db
      .select({ value: count() })
      .from(locationSuggestions)
      .where(eq(locationSuggestions.status, "pending")),
    db
      .select({ value: count() })
      .from(academySuggestions)
      .where(eq(academySuggestions.status, "pending")),
    db
      .select({ value: count() })
      .from(professorSuggestions)
      .where(eq(professorSuggestions.status, "pending")),
    db
      .select({ value: count() })
      .from(academyAccessRequests)
      .where(eq(academyAccessRequests.status, "pending")),
  ]);

  const cards = [
    {
      label: "Contas",
      value: usersCount.value,
      href: "/admin/usuarios",
      detail: `${restrictedUsers.value} suspensas/bloqueadas`,
    },
    {
      label: "Academias",
      value: academiesCount.value,
      href: "/admin/academias",
      detail: `${restrictedAcademies.value} fora da busca · ${pendingAcademies.value} sugeridas · ${pendingAccess.value} pedindo acesso`,
    },
    {
      label: "Lojas",
      value: businessesCount.value,
      href: "/admin/lojas",
      detail: `${restrictedBusinesses.value} suspensas/bloqueadas`,
    },
    {
      label: "Sugestões pendentes",
      value:
        pendingLocations.value +
        pendingAcademies.value +
        pendingProfessors.value,
      href: "/admin/sugestoes",
      detail: `${pendingLocations.value} locais · ${pendingAcademies.value} academias · ${pendingProfessors.value} professores`,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className="ui-card p-4 transition hover:border-[var(--accent)]/35"
        >
          <p className="text-[12px] text-[var(--muted)]">{card.label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">
            {card.value}
          </p>
          <p className="mt-1 text-[12px] text-[var(--muted)]">{card.detail}</p>
        </Link>
      ))}
    </section>
  );
}
