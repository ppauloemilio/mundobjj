"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  registerAcademyAction,
  registerAthleteAction,
  type AuthFormState,
} from "@/app/actions/auth";
import { AcademySelect } from "@/components/academy-select";
import { LocationFields } from "@/components/location-fields";

const initial: AuthFormState = {};

export function AthleteRegisterForm() {
  const [state, action, pending] = useActionState(registerAthleteAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nome" name="name" required />
      <Field label="E-mail" name="email" type="email" required />
      <Field label="Senha" name="password" type="password" required />
      <LocationFields />
      <AcademySelect />
      {state.error ? <p className="text-sm text-[var(--accent)]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-[var(--accent)] px-5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar conta de praticante"}
      </button>
      <p className="text-sm text-[var(--muted)]">
        Já tem conta?{" "}
        <Link href="/entrar" className="underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

export function AcademyRegisterForm() {
  const [state, action, pending] = useActionState(registerAcademyAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Seu nome" name="name" required />
      <Field label="E-mail" name="email" type="email" required />
      <Field label="Senha" name="password" type="password" required />
      <Field label="Nome da academia" name="academyName" required />
      <Field label="Professor responsável" name="professorName" />
      <Field label="WhatsApp da academia" name="whatsapp" />
      <Field label="Endereço" name="address" required />
      <LocationFields required />
      {state.error ? <p className="text-sm text-[var(--accent)]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-[var(--accent)] px-5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Criando..." : "Criar conta de academia"}
      </button>
      <p className="text-sm text-[var(--muted)]">
        Já tem conta?{" "}
        <Link href="/entrar" className="underline">
          Entrar
        </Link>
      </p>
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
