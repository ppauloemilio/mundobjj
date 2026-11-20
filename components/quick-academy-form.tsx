"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  quickRegisterAcademyAction,
  type QuickAcademyState,
} from "@/app/actions/quick-academy";
import { LocationFields } from "@/components/location-fields";

const initial: QuickAcademyState = {};

export function QuickAcademyForm() {
  const [state, action, pending] = useActionState(
    quickRegisterAcademyAction,
    initial,
  );

  if (state.claimToken && state.slug) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
        <p className="text-sm text-green-700">{state.success}</p>
        <div className="rounded-xl bg-[var(--accent-soft)] px-4 py-3">
          <p className="text-sm font-medium">Código de reivindicação</p>
          <p className="mt-1 text-2xl font-semibold tracking-widest">
            {state.claimToken}
          </p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Envie este código para a academia. Com ele ela cria a conta e assume
            o cadastro em{" "}
            <Link href="/reivindicar" className="underline">
              /reivindicar
            </Link>
            .
          </p>
        </div>
        <Link href={`/academia/${state.slug}`} className="text-sm underline">
          Ver ficha pública
        </Link>
        <Link href="/" className="text-sm text-[var(--muted)] underline">
          Voltar à busca
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nome da academia" name="name" required />
      <Field label="WhatsApp" name="whatsapp" required />
      <Field label="Endereço" name="address" required />
      <Field label="Bairro" name="neighborhood" />
      <Field label="Professor (opcional)" name="professorName" />
      <Field label="Equipe / afiliação" name="affiliation" />
      <LocationFields required />
      <p className="text-sm text-[var(--muted)]">
        Cadastro rápido sem criar conta. A academia usa o código gerado para
        reivindicar o acesso depois.
      </p>
      {state.error ? (
        <p className="text-sm text-[var(--accent)]">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-[var(--accent)] px-5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Cadastrando..." : "Cadastrar academia"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        required={required}
        className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
      />
    </label>
  );
}