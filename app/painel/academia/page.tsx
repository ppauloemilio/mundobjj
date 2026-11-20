import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AcademyForm } from "@/components/academy-form";
import { AcademyProfessorPanel } from "@/components/academy-professor-panel";
import { ChangePasswordForm } from "@/components/change-password-form";
import { requireDb } from "@/db";
import {
  academyProfessors,
  classSchedules,
  memberships,
  profiles,
} from "@/db/schema";
import { getCitySelection } from "@/lib/location-input";
import { getOwnedAcademies, requireUser } from "@/lib/session";

export const instant = false;

export default async function PainelAcademiaPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  if (user.accountType !== "academy" && user.role !== "admin") {
    redirect("/painel");
  }
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

  const professorLinks = academy
    ? await db
        .select({
          linkId: academyProfessors.id,
          profileId: profiles.id,
          name: profiles.name,
          slug: profiles.slug,
          status: academyProfessors.status,
        })
        .from(academyProfessors)
        .innerJoin(profiles, eq(academyProfessors.professorProfileId, profiles.id))
        .where(eq(academyProfessors.academyId, academy.id))
        .orderBy(asc(profiles.name))
    : [];

  const activeProfessors = professorLinks.filter((row) => row.status === "active");
  const place = academy ? await getCitySelection(academy.cityId) : null;

  const members = academy
    ? await db
        .select({
          name: profiles.name,
          slug: profiles.slug,
          belt: profiles.belt,
          status: memberships.status,
        })
        .from(memberships)
        .innerJoin(profiles, eq(memberships.profileId, profiles.id))
        .where(
          and(
            eq(memberships.academyId, academy.id),
            eq(memberships.status, "active"),
          ),
        )
        .orderBy(asc(profiles.name))
    : [];

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
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
          professors={activeProfessors.map((row) => ({
            id: row.profileId,
            name: row.name,
          }))}
          academy={
            academy
              ? {
                  id: academy.id,
                  name: academy.name,
                  affiliation: academy.affiliation,
                  professorName: academy.professorName,
                  whatsapp: academy.whatsapp,
                  address: academy.address,
                  postalCode: academy.postalCode,
                  street: academy.street,
                  streetNumber: academy.streetNumber,
                  complement: academy.complement,
                  neighborhood: academy.neighborhood,
                  cityId: academy.cityId,
                  countryIso2: place?.countryIso2,
                  stateCode: place?.stateCode,
                  cityName: place?.cityName,
                  acceptsVisitor: academy.acceptsVisitor,
                  dropInPrice: academy.dropInPrice,
                  visitorNotes: academy.visitorNotes,
                  schedules: schedules.map((schedule) => ({
                    weekday: schedule.weekday,
                    startsAt: schedule.startsAt.slice(0, 5),
                    endsAt: schedule.endsAt.slice(0, 5),
                    kind: schedule.kind,
                    level: schedule.level ?? "",
                    professorProfileId: schedule.professorProfileId ?? "",
                  })),
                }
              : undefined
          }
        />
      </div>

      {academy ? (
        <AcademyProfessorPanel
          academyId={academy.id}
          professors={professorLinks.map((row) => ({
            linkId: row.linkId,
            profileId: row.profileId,
            name: row.name,
            slug: row.slug,
            status: row.status,
          }))}
        />
      ) : null}

      <ChangePasswordForm />

      {academy ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Alunos vinculados</h2>
          <p className="text-sm text-[var(--muted)]">
            Pessoas que escolheram esta academia no perfil.
          </p>
          {members.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Ainda não há alunos vinculados.
            </p>
          ) : (
            members.map((member) => (
              <Link
                key={member.slug}
                href={`/atleta/${member.slug}`}
                className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3"
              >
                <p className="font-medium">{member.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  Faixa {member.belt} · ver perfil
                </p>
              </Link>
            ))
          )}
        </section>
      ) : null}
    </section>
  );
}
