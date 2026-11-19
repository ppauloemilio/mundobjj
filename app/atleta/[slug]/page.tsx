import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/db";
import { academies, cities, memberships, profiles, states } from "@/db/schema";

export const instant = false;

const beltLabel: Record<string, string> = {
  white: "Branca",
  blue: "Azul",
  purple: "Roxa",
  brown: "Marrom",
  black: "Preta",
  gray: "Cinza",
  yellow: "Amarela",
  orange: "Laranja",
  green: "Verde",
};

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

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-10 sm:px-6">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
        Atleta
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">{profile.name}</h1>
      <p className="text-[var(--muted)]">
        {[beltLabel[profile.belt] ?? profile.belt, `${profile.stripes} graus`, place]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {membership ? (
        <p className="text-sm">
          Academia:{" "}
          <Link href={`/academia/${membership.academySlug}`} className="underline">
            {membership.academyName}
          </Link>
        </p>
      ) : null}
      {profile.bio ? <p className="leading-7">{profile.bio}</p> : null}
      {profile.competitor ? (
        <p className="text-sm font-medium">Competidor</p>
      ) : null}
      {profile.showWhatsapp && profile.whatsapp ? (
        <p className="text-sm">WhatsApp: {profile.whatsapp}</p>
      ) : null}
      {profile.showEmail && profile.contactEmail ? (
        <p className="text-sm">E-mail: {profile.contactEmail}</p>
      ) : null}
    </main>
  );
}
