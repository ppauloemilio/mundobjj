import { asc, desc, eq } from "drizzle-orm";
import { AdminAccessRequests } from "@/components/admin-access-requests";
import { AdminAcademyCard } from "@/components/admin-academy-actions";
import { AdminAcademySuggestionCard } from "@/components/admin-academy-suggestion-card";
import { AdminCreateAcademyForm } from "@/components/admin-create-academy-form";
import { requireDb } from "@/db";
import {
  academies,
  academyAccessRequests,
  academySuggestions,
} from "@/db/schema";
import { getCitySelection } from "@/lib/location-input";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminAcademiasPage() {
  await requireAdmin();
  const db = requireDb();
  const rows = await db.select().from(academies).orderBy(asc(academies.name));

  const suggestions = await db
    .select()
    .from(academySuggestions)
    .where(eq(academySuggestions.status, "pending"))
    .orderBy(desc(academySuggestions.createdAt));

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
        <h2 className="text-xl font-semibold">Academias sugeridas</h2>
        <p className="text-sm text-[var(--muted)]">
          Ao aceitar, a academia entra como cadastrada (sem dono). O responsável
          pode pedir acesso na ficha pública.
        </p>
        {suggestions.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Nenhuma sugestão pendente.
          </p>
        ) : (
          suggestions.map((item) => (
            <AdminAcademySuggestionCard
              key={item.id}
              suggestion={{
                id: item.id,
                name: item.name,
                cityText: item.cityText,
                contact: item.contact,
                notes: item.notes,
              }}
            />
          ))
        )}
      </section>

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
          Edite a ficha, suspenda, bloqueie na busca ou libere acesso ao
          responsável.
        </p>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Nenhuma academia cadastrada.
          </p>
        ) : (
          await Promise.all(
            rows.map(async (academy) => {
              const place = await getCitySelection(academy.cityId);
              return (
                <AdminAcademyCard
                  key={academy.id}
                  academy={{
                    id: academy.id,
                    name: academy.name,
                    slug: academy.slug,
                    professorName: academy.professorName,
                    whatsapp: academy.whatsapp,
                    address: academy.address,
                    postalCode: academy.postalCode,
                    street: academy.street,
                    streetNumber: academy.streetNumber,
                    complement: academy.complement,
                    neighborhood: academy.neighborhood,
                    countryIso2: place?.countryIso2,
                    stateCode: place?.stateCode,
                    cityName: place?.cityName,
                    acceptsVisitor: academy.acceptsVisitor,
                    blockedAt: academy.blockedAt,
                    suspendedAt: academy.suspendedAt,
                    ownerId: academy.ownerId,
                  }}
                />
              );
            }),
          )
        )}
      </section>
    </section>
  );
}
