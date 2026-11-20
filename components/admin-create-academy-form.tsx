"use client";

import { useActionState } from "react";
import {
  createAcademyAdminAction,
  type AdminFormState,
} from "@/app/actions/admin";
import { LocationFields } from "@/components/location-fields";
import { ResponsibleProfessorSelect } from "@/components/responsible-professor-select";

const initial: AdminFormState = {};

export function AdminCreateAcademyForm() {
  const [state, action, pending] = useActionState(
    createAcademyAdminAction,
    initial,
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"
    >
      <div>
        <h2 className="text-lg font-semibold">Cadastrar academia</h2>
        <p className="text-sm text-[var(--muted)]">
          Cadastro feito pelo admin. O responsável pode pedir o acesso depois.
        </p>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Nome
        <input
          name="name"
          required
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
      </label>
      <ResponsibleProfessorSelect />
      <label className="flex flex-col gap-1 text-sm">
        WhatsApp
        <input
          name="whatsapp"
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Endereço
        <input
          name="address"
          required
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Bairro
        <input
          name="neighborhood"
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Equipe / afiliação
        <input
          name="affiliation"
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
      </label>
      <LocationFields required />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="acceptsVisitor" defaultChecked />
        Aceita visitante
      </label>
      {state.error ? (
        <p className="text-sm text-[var(--accent)]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-700">{state.success}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-fit rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Cadastrar academia"}
      </button>
    </form>
  );
}