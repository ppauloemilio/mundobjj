"use client";

import { useActionState } from "react";
import {
  requestAcademyLinkAction,
  type LinkProfessorState,
} from "@/app/actions/academy-professor";

const initial: LinkProfessorState = {};

export function ProfessorAcademyLinkForm() {
  const [state, action, pending] = useActionState(requestAcademyLinkAction, initial);

  return (
    <form
      action={action}
      className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] p-4"
    >
      <h2 className="text-lg font-semibold">Solicitar vínculo com academia</h2>
      <label className="flex flex-col gap-1 text-sm">
        Link da academia
        <input
          name="academySlug"
          placeholder="ex.: alliance-centro-a1b2"
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          required
        />
      </label>
      {state.error ? <p className="text-sm text-[var(--accent)]">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-fit rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar solicitação"}
      </button>
    </form>
  );
}