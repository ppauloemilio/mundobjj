"use client";

import { useActionState } from "react";
import {
  createAcademyAdminAction,
  type AdminFormState,
} from "@/app/actions/admin";
import { AddressFields } from "@/components/address-fields";
import { ResponsibleProfessorSelect } from "@/components/responsible-professor-select";

const initial: AdminFormState = {};

export function AdminCreateAcademyForm() {
  const [state, action, pending] = useActionState(
    createAcademyAdminAction,
    initial,
  );

  return (
    <form action={action} className="ui-card flex flex-col gap-2.5 p-4">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">
          Cadastrar academia
        </h2>
        <p className="mt-1 text-[12px] text-[var(--muted)]">
          Cadastro feito pelo admin. No Brasil use CEP; nos demais países, país
          → estado → cidade.
        </p>
      </div>
      <label className="flex flex-col gap-1 text-[13px]">
        Nome
        <input name="name" required className="ui-input" />
      </label>
      <ResponsibleProfessorSelect />
      <label className="flex flex-col gap-1 text-[13px]">
        WhatsApp
        <input name="whatsapp" className="ui-input" />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        Equipe / afiliação
        <input name="affiliation" className="ui-input" />
      </label>
      <AddressFields required />
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" name="acceptsVisitor" defaultChecked />
        Aceita visitante
      </label>
      {state.error ? (
        <p className="text-[13px] text-[var(--accent)]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-[13px] text-green-700">{state.success}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="ui-btn ui-btn-primary w-fit disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Cadastrar academia"}
      </button>
    </form>
  );
}
