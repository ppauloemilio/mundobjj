import { asc } from "drizzle-orm";
import { AdminAcademyCard } from "@/components/admin-academy-actions";
import { requireDb } from "@/db";
import { academies } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminAcademiasPage() {
  await requireAdmin();
  const db = requireDb();
  const rows = await db.select().from(academies).orderBy(asc(academies.name));

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-[var(--muted)]">
        Edite a ficha ou bloqueie a academia na busca pública. Academias sem
        dono ainda podem ser reivindicadas.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Nenhuma academia cadastrada.</p>
      ) : (
        rows.map((academy) => (
          <AdminAcademyCard
            key={academy.id}
            academy={{
              id: academy.id,
              name: academy.name,
              slug: academy.slug,
              professorName: academy.professorName,
              whatsapp: academy.whatsapp,
              address: academy.address,
              acceptsVisitor: academy.acceptsVisitor,
              blockedAt: academy.blockedAt,
              ownerId: academy.ownerId,
              claimToken: academy.claimToken,
            }}
          />
        ))
      )}
    </section>
  );
}
