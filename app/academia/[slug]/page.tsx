import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { AcademyAccessRequestForm } from "@/components/academy-access-request-form";
import { requireDb } from "@/db";
import { academies, cities, classSchedules, states } from "@/db/schema";
import { classKindLabel } from "@/lib/labels";

export const instant = false;

const weekdays = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default async function AcademiaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = requireDb();
  const [row] = await db
    .select({
      academy: academies,
      city: cities.name,
      state: states.code,
    })
    .from(academies)
    .leftJoin(cities, eq(academies.cityId, cities.id))
    .leftJoin(states, eq(cities.stateId, states.id))
    .where(eq(academies.slug, slug))
    .limit(1);

  if (!row || row.academy.blockedAt) notFound();

  const schedules = await db
    .select()
    .from(classSchedules)
    .where(eq(classSchedules.academyId, row.academy.id))
    .orderBy(asc(classSchedules.weekday), asc(classSchedules.startsAt));

  const academy = row.academy;
  const whatsappLink = academy.whatsapp
    ? `https://wa.me/${academy.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        "Olá, gostaria de treinar como visitante.",
      )}`
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
          Academia
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {academy.name}
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          {[
            academy.professorName,
            academy.neighborhood,
            row.city,
            row.state,
            academy.affiliation,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      {academy.address ? <p>{academy.address}</p> : null}

      {!academy.ownerId ? (
        <AcademyAccessRequestForm academyId={academy.id} />
      ) : null}

      {academy.acceptsVisitor ? (
        <p className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm">
          Aceita visitante
          {academy.dropInPrice ? ` · R$ ${academy.dropInPrice}` : ""}
          {academy.visitorNotes ? ` · ${academy.visitorNotes}` : ""}
        </p>
      ) : null}

      {whatsappLink ? (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 font-semibold text-white"
        >
          Chamar no WhatsApp
        </a>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Horários</h2>
        {schedules.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Sem grade cadastrada.</p>
        ) : (
          schedules.map((schedule) => (
            <article
              key={schedule.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3"
            >
              <p className="font-medium">
                {weekdays[schedule.weekday]} · {schedule.startsAt.slice(0, 5)}–
                {schedule.endsAt.slice(0, 5)}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {[
                  classKindLabel[schedule.kind] ?? schedule.kind,
                  schedule.level,
                  schedule.professorName,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
