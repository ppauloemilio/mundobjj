import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { listCompetitionsForProfile } from "@/app/actions/competitions";
import { PublicAthleteProfile } from "@/components/public-athlete-profile";
import { requireDb } from "@/db";
import {
  academies,
  athleteProfessors,
  cities,
  memberships,
  profiles,
  states,
} from "@/db/schema";

const professorProfiles = alias(profiles, "professor_profiles");

export const instant = false;

export default async function AtletaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = requireDb();
  const [row] = await db
    .select({
      profile: profiles,
      city: cities.name,
      state: states.code,
    })
    .from(profiles)
    .leftJoin(cities, eq(profiles.cityId, cities.id))
    .leftJoin(states, eq(cities.stateId, states.id))
    .where(eq(profiles.slug, slug))
    .limit(1);

  if (!row) notFound();

  const { profile } = row;
  const place = [row.city, row.state].filter(Boolean).join(", ");

  const [membership] = await db
    .select({
      academyName: academies.name,
      academySlug: academies.slug,
      academyId: academies.id,
    })
    .from(memberships)
    .innerJoin(academies, eq(memberships.academyId, academies.id))
    .where(
      and(
        eq(memberships.profileId, profile.id),
        eq(memberships.status, "active"),
      ),
    )
    .limit(1);

  const [professor] = membership
    ? await db
        .select({ name: professorProfiles.name })
        .from(athleteProfessors)
        .innerJoin(
          professorProfiles,
          eq(athleteProfessors.professorProfileId, professorProfiles.id),
        )
        .where(
          and(
            eq(athleteProfessors.profileId, profile.id),
            eq(athleteProfessors.academyId, membership.academyId),
            eq(athleteProfessors.status, "active"),
          ),
        )
        .limit(1)
    : [undefined];

  const competitions = profile.competitor
    ? await listCompetitionsForProfile(profile.id, { includeHidden: false })
    : [];

  return (
    <PublicAthleteProfile
      profile={{
        name: profile.name,
        slug: profile.slug,
        belt: profile.belt,
        stripes: profile.stripes,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        weightCategory: profile.weightCategory,
        startedAt: profile.startedAt,
        whatsapp: profile.whatsapp,
        contactEmail: profile.contactEmail,
        showWhatsapp: profile.showWhatsapp,
        showEmail: profile.showEmail,
        competitor: profile.competitor,
      }}
      place={place}
      academy={
        membership
          ? { name: membership.academyName, slug: membership.academySlug }
          : null
      }
      professorName={professor?.name ?? null}
      competitions={competitions}
    />
  );
}
