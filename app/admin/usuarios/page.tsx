import { asc, eq } from "drizzle-orm";
import { AdminUserCard } from "@/components/admin-user-actions";
import { requireDb } from "@/db";
import { academies, profiles, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminUsuariosPage() {
  const admin = await requireAdmin();
  const db = requireDb();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      accountType: users.accountType,
      blockedAt: users.blockedAt,
      profileWhatsapp: profiles.whatsapp,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .orderBy(asc(users.email));

  const owned = await db
    .select({
      ownerId: academies.ownerId,
      whatsapp: academies.whatsapp,
    })
    .from(academies);

  const academyWhatsapp = new Map(
    owned
      .filter((row) => row.ownerId)
      .map((row) => [row.ownerId as string, row.whatsapp]),
  );

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-[var(--muted)]">
        Defina uma senha manualmente ou gere uma aleatória e envie pelo WhatsApp
        cadastrado. O usuário pode trocar a senha no painel.
      </p>
      {rows.map((user) => (
        <AdminUserCard
          key={user.id}
          currentAdminId={admin.id}
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            accountType: user.accountType,
            blockedAt: user.blockedAt,
            whatsapp:
              user.profileWhatsapp || academyWhatsapp.get(user.id) || null,
          }}
        />
      ))}
    </section>
  );
}
