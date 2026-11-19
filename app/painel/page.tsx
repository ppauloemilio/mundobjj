import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { requireDb } from "@/db";
import { athleteProfessors, memberships } from "@/db/schema";
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

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Meu perfil</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Perfil público:{" "}
          <Link href={`/atleta/${profile.slug}`} className="underline">
            /atleta/{profile.slug}
          </Link>
        </p>
      </div>
      <ProfileForm
        profile={{
          name: profile.name,
          slug: profile.slug,
          cityId: profile.cityId,
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
          showWhatsapp: profile.showWhatsapp,
          showEmail: profile.showEmail,
        }}
      />
    </section>
  );
}
