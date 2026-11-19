import Link from "next/link";
import { eq } from "drizzle-orm";
import { AcademyForm } from "@/components/academy-form";
import { requireDb } from "@/db";
import { classSchedules } from "@/db/schema";
import { getOwnedAcademies, requireUser } from "@/lib/session";

export const instant = false;

export default async function PainelAcademiaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const owned = await getOwnedAcademies(user.id);
  const academy = owned[0] ?? null;
  const params = await searchParams;
  const db = requireDb();

  const schedules = academy
    ? await db
        .select()
        .from(classSchedules)
        .where(eq(classSchedules.academyId, academy.id))
    : [];

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {academy ? "Minha academia" : "Cadastrar academia"}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          A academia aparece na busca por cidade e perto de mim.
          {academy ? (
            <>
              {" "}
              Página pública:{" "}
              <Link href={`/academia/${academy.slug}`} className="underline">
                /academia/{academy.slug}
              </Link>
            </>
          ) : null}
        </p>
        {params.saved ? (
          <p className="mt-2 text-sm text-green-700">Academia salva.</p>
        ) : null}
      </div>
      <AcademyForm
        academy={
          academy
            ? {
                id: academy.id,
                name: academy.name,
                affiliation: academy.affiliation,
                professorName: academy.professorName,
                whatsapp: academy.whatsapp,
                address: academy.address,
                neighborhood: academy.neighborhood,
                cityId: academy.cityId,
                acceptsVisitor: academy.acceptsVisitor,
                dropInPrice: academy.dropInPrice,
                visitorNotes: academy.visitorNotes,
                schedules: schedules.map((schedule) => ({
                  weekday: schedule.weekday,
                  startsAt: schedule.startsAt.slice(0, 5),
                  endsAt: schedule.endsAt.slice(0, 5),
                  kind: schedule.kind,
                  level: schedule.level ?? "",
                  professorName: schedule.professorName ?? "",
                })),
              }
            : undefined
        }
      />
    </section>
  );
}
