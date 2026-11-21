import { asc } from "drizzle-orm";
import {
  AdminBusinessCard,
  AdminCreateBusinessForm,
} from "@/components/admin-business-actions";
import { requireDb } from "@/db";
import { businessCategories, businesses } from "@/db/schema";
import { getCitySelection } from "@/lib/location-input";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminLojasPage() {
  await requireAdmin();
  const db = requireDb();

  const [categories, rows] = await Promise.all([
    db
      .select({ id: businessCategories.id, name: businessCategories.name })
      .from(businessCategories)
      .orderBy(asc(businessCategories.sortOrder), asc(businessCategories.name)),
    db.select().from(businesses).orderBy(asc(businesses.name)),
  ]);

  return (
    <section className="flex flex-col gap-8">
      {categories.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          Nenhuma categoria de loja no banco. Rode o seed para criar categorias.
        </p>
      ) : (
        <AdminCreateBusinessForm categories={categories} />
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Lojas cadastradas</h2>
        <p className="text-sm text-[var(--muted)]">
          Edite, suspenda ou bloqueie lojas da busca.
        </p>
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma loja cadastrada.</p>
        ) : (
          await Promise.all(
            rows.map(async (business) => {
              const place = await getCitySelection(business.cityId);
              return (
                <AdminBusinessCard
                  key={business.id}
                  categories={categories}
                  business={{
                    id: business.id,
                    name: business.name,
                    slug: business.slug,
                    categoryId: business.categoryId,
                    whatsapp: business.whatsapp,
                    link: business.link,
                    address: business.address,
                    sponsored: business.sponsored,
                    blockedAt: business.blockedAt,
                    suspendedAt: business.suspendedAt,
                    countryIso2: place?.countryIso2,
                    stateCode: place?.stateCode,
                    cityName: place?.cityName,
                  }}
                />
              );
            }),
          )
        )}
      </section>
    </section>
  );
}
