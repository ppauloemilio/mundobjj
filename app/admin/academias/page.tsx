import { asc, desc, eq } from "drizzle-orm";
import { AdminAccessRequests } from "@/components/admin-access-requests";
import { AdminAcademyCard } from "@/components/admin-academy-actions";
import { AdminCreateAcademyForm } from "@/components/admin-create-academy-form";
import { requireDb } from "@/db";
import {
  academies,
  academyAccessRequests,
} from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminAcademiasPage() {
  await requireAdmin();
  const db = requireDb();
  const rows = await db.select().from(academies).orderBy(asc(academies.name));

  const requests = await db
    .select({
      id: academyAccessRequests.id,
      name: academyAccessRequests.name,
      email: academyAccessRequests.email,
      whatsapp: academyAccessRequests.whatsapp,
      message: academyAccessRequests.message,
      academyName: academies.name,
      academySlug: academies.slug,
    })
    .from(academyAccessRequests)
    .innerJoin(academies, eq(academyAccessRequests.academyId, academies.id))
    .where(eq(academyAccessRequests.status, "pending"))
    .orderBy(desc(academyAccessRequests.createdAt));

  return (
    <section className="flex flex-col gap-8">
      <AdminCreateAcademyForm />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Solicitações de acesso</h2>
        <p className="text-sm text-[var(--muted)]">
          Responsáveis que pediram para assumir uma academia cadastrada pelo
          admin. Ao aprovar, o sistema cria o login e você envia a senha.
        </p>
        <AdminAccessRequests requests={requests} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Academias cadastradas</h2>
        <p className="text-sm text-[var(--muted)]">
          Edite a ficha, bloqueie na busca ou libere acesso ao responsável.
        </p>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Nenhuma academia cadastrada.
          </p>
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
              }}
            />
          ))
        )}
      </section>
    </section>
  );
}