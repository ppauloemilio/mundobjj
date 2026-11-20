"use client";

import { useActionState } from "react";
import {
  toggleAcademyBlockAction,
  updateAcademyAdminAction,
  type AdminFormState,
} from "@/app/actions/admin";

const initial: AdminFormState = {};

type AcademyRow = {
  id: string;
  name: string;
  slug: string;
  professorName: string | null;
  whatsapp: string | null;
  address: string | null;
  acceptsVisitor: boolean;
  blockedAt: Date | null;
  ownerId: string | null;
  claimToken: string | null;
};

export function AdminAcademyCard({ academy }: { academy: AcademyRow }) {
  const [state, action, pending] = useActionState(
    updateAcademyAdminAction,
    initial,
  );

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="academyId" value={academy.id} />
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Nome
          <input
            name="name"
            defaultValue={academy.name}
            required
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Professor
          <input
            name="professorName"
            defaultValue={academy.professorName ?? ""}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          WhatsApp
          <input
            name="whatsapp"
            defaultValue={academy.whatsapp ?? ""}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Endereço
          <input
            name="address"
            defaultValue={academy.address ?? ""}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="acceptsVisitor"
            defaultChecked={academy.acceptsVisitor}
          />
          Aceita visitante
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href={`/academia/${academy.slug}`} className="text-sm underline">
          Ver página pública
        </a>
        <form action={toggleAcademyBlockAction}>
          <input type="hidden" name="academyId" value={academy.id} />
          <input
            type="hidden"
            name="block"
            value={academy.blockedAt ? "0" : "1"}
          />
          <button
            type="submit"
            className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm"
          >
            {academy.blockedAt ? "Desbloquear" : "Bloquear na busca"}
          </button>
        </form>
      </div>
      {academy.blockedAt ? (
        <p className="mt-2 text-sm text-[var(--accent)]">Bloqueada na busca</p>
      ) : null}
      {!academy.ownerId ? (
        <div className="mt-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm">
          Sem dono · código de reivindicação:{" "}
          <strong>{academy.claimToken || "—"}</strong>
          {academy.claimToken ? (
            <>
              {" "}
              ·{" "}
              <a
                href={`/reivindicar?codigo=${academy.claimToken}`}
                className="underline"
              >
                link
              </a>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
