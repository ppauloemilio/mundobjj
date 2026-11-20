"use client";

import { useActionState } from "react";
import {
  requestAcademyAccessAction,
  type AccessFormState,
} from "@/app/actions/academy-access";

const initial: AccessFormState = {};

export function AcademyAccessRequestForm({ academyId }: { academyId: string }) {
  const [state, action, pending] = useActionState(
    requestAcademyAccessAction,
    initial,
  );

  if (state.success) {
    return (
      <div className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm text-green-700">
        {state.success}
      </div>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] p-4"
    >
      <div>
        <h2 className="text-lg font-semibold">Esta academia é sua?</h2>
        <p className="text-sm text-[var(--muted)]">
          Solicite o acesso ao admin. Se aprovado, você recebe login e senha.
        </p>
      </div>
      <input type="hidden" name="academyId" value={academyId} />
      <label className="flex flex-col gap-1 text-sm">
        Seu nome
        <input
          name="name"
          required
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        E-mail para login
        <input
          name="email"
          type="email"
          required
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        WhatsApp
        <input
          name="whatsapp"
          required
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Mensagem (opcional)
        <textarea
          name="message"
          rows={3}
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2"
          placeholder="Sou o responsável / professor desta academia..."
        />
      </label>
      {state.error ? (
        <p className="text-sm text-[var(--accent)]">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Solicitar acesso"}
      </button>
    </form>
  );
}