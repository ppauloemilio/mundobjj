import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { listCompetitionsForProfile } from "@/app/actions/competitions";
import { CompetitionsPanel } from "@/components/competitions-panel";
import { ProfileForm } from "@/components/profile-form";
import { requireDb } from "@/db";
import { athleteProfessors, memberships } from "@/db/schema";
import { getCitySelection } from "@/lib/location-input";
import { getRequestLocale } from "@/lib/i18n/locale";
import { t } from "@/lib/i18n/messages";
import { getProfileForUser, requireUser } from "@/lib/session";

export const instant = false;

export default async function PainelPage() {
  const user = await requireUser();
  if (user.accountType === "professor") redirect("/painel/professor");
  if (user.accountType === "academy") redirect("/painel/academia");
  const profile = await getProfileForUser(user.id);
  const locale = await getRequestLocale();

  if (!profile) {
    return <p>{t(locale, "profileNotFound")}</p>;
  }

  const db = requireDb();
  const [membership] = await db
    .select({ academyId: memberships.academyId })
    .from(memberships)
    .where(
      and(
        eq(memberships.profileId, profile.id),
        eq(memberships.status, "active"),
      ),
    )
    .limit(1);

  const [athleteProfessor] = membership
    ? await db
        .select({ professorProfileId: athleteProfessors.professorProfileId })
        .from(athleteProfessors)
        .where(
          and(
            eq(athleteProfessors.profileId, profile.id),
            eq(athleteProfessors.academyId, membership.academyId),
            eq(athleteProfessors.status, "active"),
          ),
        )
        .limit(1)
    : [undefined];

  const place = await getCitySelection(profile.cityId);
  const needsOnboarding = !profile.onboardingCompletedAt;
  const comps = profile.competitor
    ? await listCompetitionsForProfile(profile.id, { includeHidden: true })
    : [];

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {needsOnboarding
            ? t(locale, "completeProfileTitle")
            : t(locale, "myProfileTitle")}
        </h1>
      </div>
      <ProfileForm
        showHomeCta={needsOnboarding}
        profile={{
          name: profile.name,
          slug: profile.slug,
          cityId: profile.cityId,
          countryIso2: place?.countryIso2,
          stateCode: place?.stateCode,
          cityName: place?.cityName,
          academyId: membership?.academyId ?? null,
          professorProfileId: athleteProfessor?.professorProfileId ?? null,
          belt: profile.belt,
          stripes: profile.stripes,
          style: profile.style,
          competitor: profile.competitor,
          bio: profile.bio,
          weightKg: profile.weightKg,
          weightCategory: profile.weightCategory,
          avatarUrl: profile.avatarUrl,
          birthDate: profile.birthDate,
          startedAt: profile.startedAt,
          whatsapp: profile.whatsapp,
          contactEmail: profile.contactEmail,
          accountEmail: user.email,
          showWhatsapp: profile.showWhatsapp,
          showEmail: profile.showEmail,
        }}
      />

      {profile.competitor ? (
        <div id="section-competitions" className="flex flex-col gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t(locale, "compSectionTitle")}
          </h2>
          <CompetitionsPanel
            initial={comps}
            profile={{
              belt: profile.belt,
              weightCategory: profile.weightCategory,
              birthDate: profile.birthDate,
              name: profile.name,
              cityName: place?.cityName,
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
