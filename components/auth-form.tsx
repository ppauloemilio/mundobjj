"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";

const initial: AuthFormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="E-mail" name="email" type="email" autoComplete="email" required />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {state.error ? <p className="text-sm text-[var(--accent)]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-[var(--accent)] px-5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-sm text-[var(--muted)]">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-[var(--ink)] underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
      />
    </label>
  );
}
