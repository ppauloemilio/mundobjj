import Link from "next/link";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";
import { ProfileForm } from "@/components/profile-form";
import { ProfessorAcademyLinkForm } from "@/components/professor-academy-link-form";
import { VerifyCompetitionButton } from "@/components/verify-competition-button";
import { requireDb } from "@/db";
import {
  academies,
  academyProfessors,
  athleteProfessors,
  competitions,
  profiles,
} from "@/db/schema";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import { getCitySelection } from "@/lib/location-input";
import { getProfileForUser, requireUser } from "@/lib/session";

export const instant = false;

export default async function PainelProfessorPage() {
  const user = await requireUser();
  if (user.accountType !== "professor") {
    redirect("/painel");
  }

  const profile = await getProfileForUser(user.id);
  if (!profile) return <p>Perfil não encontrado.</p>;

  const db = requireDb();

  const links = await db
    .select({
      status: academyProfessors.status,
      academyName: academies.name,
      academySlug: academies.slug,
    })
    .from(academyProfessors)
    .innerJoin(academies, eq(academyProfessors.academyId, academies.id))
    .where(eq(academyProfessors.professorProfileId, profile.id))
    .orderBy(asc(academies.name));

  const students = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      slug: profiles.slug,
      belt: profiles.belt,
      academyName: academies.name,
    })
    .from(athleteProfessors)
    .innerJoin(profiles, eq(athleteProfessors.profileId, profiles.id))
    .innerJoin(academies, eq(athleteProfessors.academyId, academies.id))
    .where(
      and(
        eq(athleteProfessors.professorProfileId, profile.id),
        eq(athleteProfessors.status, "active"),
      ),
    )
    .orderBy(asc(profiles.name));

  const studentIds = students.map((student) => student.id);
  const pendingComps =
    studentIds.length === 0
      ? []
      : await db
          .select({
            id: competitions.id,
            name: competitions.name,
            eventDate: competitions.eventDate,
            result: competitions.result,
            athleteName: profiles.name,
            athleteSlug: profiles.slug,
          })
          .from(competitions)
          .innerJoin(profiles, eq(competitions.profileId, profiles.id))
          .where(
            and(
              inArray(competitions.profileId, studentIds),
              isNull(competitions.verifiedAt),
              eq(competitions.hidden, false),
            ),
          )
          .orderBy(desc(competitions.eventDate))
          .limit(20);

  const place = await getCitySelection(profile.cityId);
  const locale = await getRequestLocale();

  return (
    <section className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Painel do professor</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Perfil público:{" "}
          <Link href={`/atleta/${profile.slug}`} className="underline">
            /atleta/{profile.slug}
          </Link>
        </p>
      </div>

      <ProfileForm
        hideAcademyFields
        profile={{
          name: profile.name,
          slug: profile.slug,
          cityId: profile.cityId,
          countryIso2: place?.countryIso2,
          stateCode: place?.stateCode,
          cityName: place?.cityName,
          academyId: null,
          professorProfileId: null,
          belt: profile.belt,
          stripes: profile.stripes,
          style: profile.style,
          competitor: profile.competitor,
          bio: profile.bio,
          weightKg: profile.weightKg,
          startedAt: profile.startedAt,
          whatsapp: profile.whatsapp,
          contactEmail: profile.contactEmail,
          showWhatsapp: profile.showWhatsapp,
          showEmail: profile.showEmail,
        }}
      />

      <ChangePasswordForm />

      <ProfessorAcademyLinkForm />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Academias</h2>
        {links.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum vínculo ainda.</p>
        ) : (
          links.map((link) => (
            <div
              key={`${link.academySlug}-${link.status}`}
              className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3"
            >
              <p className="font-medium">{link.academyName}</p>
              <p className="text-sm text-[var(--muted)]">
                {link.status === "active" ? (
                  <>
                    Vinculado ·{" "}
                    <Link href={`/academia/${link.academySlug}`} className="underline">
                      ver academia
                    </Link>
                  </>
                ) : (
                  "Aguardando aprovação da academia"
                )}
              </p>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Alunos que te escolheram</h2>
        {students.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum aluno vinculado ainda.</p>
        ) : (
          students.map((student) => (
            <Link
              key={student.slug}
              href={`/atleta/${student.slug}`}
              className="rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3"
            >
              <p className="font-medium">{student.name}</p>
              <p className="text-sm text-[var(--muted)]">
                {student.academyName} · faixa {student.belt}
              </p>
            </Link>
          ))
        )}
      </section>

      {pendingComps.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">
            {t(locale, "compPendingVerify")}
          </h2>
          {pendingComps.map((comp) => (
            <div
              key={comp.id}
              className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{comp.name}</p>
                <p className="text-sm text-[var(--muted)]">
                  <Link href={`/atleta/${comp.athleteSlug}`} className="underline">
                    {comp.athleteName}
                  </Link>
                  {" · "}
                  {comp.eventDate}
                  {" · "}
                  {t(locale, `compResult_${comp.result}` as "compResult_GOLD")}
                </p>
              </div>
              <VerifyCompetitionButton competitionId={comp.id} />
            </div>
          ))}
        </section>
      ) : null}
    </section>
  );
}