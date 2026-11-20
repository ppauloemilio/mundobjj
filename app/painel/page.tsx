import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";
import { ProfileForm } from "@/components/profile-form";
import { requireDb } from "@/db";
import { athleteProfessors, memberships } from "@/db/schema";
import { getCitySelection } from "@/lib/location-input";
import { getProfileForUser, requireUser } from "@/lib/session";

export const instant = false;

export default async function PainelPage() {
  const user = await requireUser();
  if (user.accountType === "professor") redirect("/painel/professor");
  if (user.accountType === "academy") redirect("/painel/academia");
  const profile = await getProfileForUser(user.id);

  if (!profile) {
    return <p>Perfil não encontrado.</p>;
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

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {needsOnboarding ? "Complete seu perfil" : "Meu perfil"}
        </h1>
        <p className="mt-1.5 text-[13px] text-[var(--muted)]">
          Perfil público:{" "}
          <Link href={`/atleta/${profile.slug}`} className="underline">
            /atleta/{profile.slug}
          </Link>
        </p>
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
          startedAt: profile.startedAt,
          whatsapp: profile.whatsapp,
          contactEmail: profile.contactEmail,
          accountEmail: user.email,
          showWhatsapp: profile.showWhatsapp,
          showEmail: profile.showEmail,
        }}
      />
      <ChangePasswordForm />
    </section>
  );
}
