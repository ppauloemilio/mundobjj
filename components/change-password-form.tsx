"use client";

import { useActionState } from "react";
import {
  changeOwnPasswordAction,
  type PasswordFormState,
} from "@/app/actions/password";

const initial: PasswordFormState = {};

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(
    changeOwnPasswordAction,
    initial,
  );

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] p-4"
    >
      <h2 className="text-lg font-semibold">Alterar senha</h2>
      <label className="flex flex-col gap-1 text-sm">
        Senha atual
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Nova senha
        <input
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Confirmar nova senha
        <input
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
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
        className="min-h-11 w-fit rounded-full border border-[var(--line)] px-4 text-sm font-medium disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Atualizar senha"}
      </button>
    </form>
  );
}