"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  claimAcademyAction,
  type QuickAcademyState,
} from "@/app/actions/quick-academy";

const initial: QuickAcademyState = {};

export function ClaimAcademyForm({
  initialToken = "",
}: {
  initialToken?: string;
}) {
  const [state, action, pending] = useActionState(claimAcademyAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Código de reivindicação
        <input
          name="claimToken"
          defaultValue={initialToken}
          required
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 uppercase tracking-widest"
          placeholder="Ex.: AB12CD34"
        />
      </label>
      <Field label="Seu nome" name="name" required />
      <Field label="E-mail de acesso" name="email" type="email" required />
      <Field label="Senha" name="password" type="password" required />
      <p className="text-sm text-[var(--muted)]">
        Isso cria a conta da academia e vincula a ficha já publicada na busca.
      </p>
      {state.error ? (
        <p className="text-sm text-[var(--accent)]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-700">
          {state.success}{" "}
          <Link href="/entrar" className="underline">
            Entrar
          </Link>
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-[var(--accent)] px-5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Reivindicando..." : "Reivindicar academia"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
      />
    </label>
  );
}