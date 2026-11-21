"use client";

import { useActionState } from "react";
import {
  createBusinessAdminAction,
  setBusinessModerationAction,
  updateBusinessAdminAction,
  type AdminFormState,
} from "@/app/actions/admin";
import { AdminModerationButtons } from "@/components/admin-moderation-buttons";
import { LocationFields } from "@/components/location-fields";
import { moderationLabel, moderationStatus } from "@/lib/moderation";

const initial: AdminFormState = {};

type Category = { id: string; name: string };

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  whatsapp: string | null;
  link: string | null;
  address: string | null;
  sponsored: boolean;
  blockedAt: Date | null;
  suspendedAt: Date | null;
  countryIso2?: string | null;
  stateCode?: string | null;
  cityName?: string | null;
};

export function AdminCreateBusinessForm({
  categories,
}: {
  categories: Category[];
}) {
  const [state, action, pending] = useActionState(
    createBusinessAdminAction,
    initial,
  );

  return (
    <section className="ui-card flex flex-col gap-3 p-4">
      <h2 className="text-xl font-semibold">Nova loja</h2>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Nome
          <input
            name="name"
            required
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Categoria
          <select
            name="categoryId"
            required
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
            defaultValue={categories[0]?.id}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          WhatsApp
          <input
            name="whatsapp"
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Link
          <input
            name="link"
            type="url"
            placeholder="https://"
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Endereço (texto)
          <input
            name="address"
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <div className="sm:col-span-2">
          <LocationFields required={false} />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="sponsored" defaultChecked />
          Patrocinada (aparece na busca de lojas)
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Cadastrar loja"}
        </button>
      </form>
      {state.error ? (
        <p className="text-sm text-[var(--accent)]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-700">{state.success}</p>
      ) : null}
    </section>
  );
}

export function AdminBusinessCard({
  business,
  categories,
}: {
  business: BusinessRow;
  categories: Category[];
}) {
  const [state, action, pending] = useActionState(
    updateBusinessAdminAction,
    initial,
  );
  const status = moderationStatus(business);

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-[var(--line)] px-2 py-1 font-semibold">
          {moderationLabel(status)}
        </span>
        <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[var(--muted)]">
          /{business.slug}
        </span>
      </div>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="businessId" value={business.id} />
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Nome
          <input
            name="name"
            defaultValue={business.name}
            required
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Categoria
          <select
            name="categoryId"
            defaultValue={business.categoryId}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          WhatsApp
          <input
            name="whatsapp"
            defaultValue={business.whatsapp ?? ""}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Link
          <input
            name="link"
            defaultValue={business.link ?? ""}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Endereço
          <input
            name="address"
            defaultValue={business.address ?? ""}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <div className="sm:col-span-2">
          <LocationFields
            initialCountryIso2={business.countryIso2 ?? ""}
            initialStateCode={business.stateCode ?? ""}
            initialCityName={business.cityName ?? ""}
          />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="sponsored"
            defaultChecked={business.sponsored}
          />
          Patrocinada
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </form>
      {state.error ? (
        <p className="mt-2 text-sm text-[var(--accent)]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-2 text-sm text-green-700">{state.success}</p>
      ) : null}
      <div className="mt-4">
        <AdminModerationButtons
          entityId={business.id}
          idField="businessId"
          blockedAt={business.blockedAt}
          suspendedAt={business.suspendedAt}
          action={setBusinessModerationAction}
        />
      </div>
    </article>
  );
}
