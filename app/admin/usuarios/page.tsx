import { asc } from "drizzle-orm";
import { AdminUserCard } from "@/components/admin-user-actions";
import { requireDb } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminUsuariosPage() {
  const admin = await requireAdmin();
  const db = requireDb();
  const rows = await db.select().from(users).orderBy(asc(users.email));

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-[var(--muted)]">
        Edite dados, bloqueie acesso ou gere uma senha temporária.
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
            blockedAt: user.blockedAt,
          }}
        />
      ))}
    </section>
  );
}
