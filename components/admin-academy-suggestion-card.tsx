"use client";

import { useActionState } from "react";
import {
  approveAcademySuggestionAction,
  rejectAcademySuggestionAction,
  type SuggestionFormState,
} from "@/app/actions/suggestions";
import { AddressFields } from "@/components/address-fields";

const initial: SuggestionFormState = {};

type Suggestion = {
  id: string;
  name: string;
  cityText: string | null;
  contact: string | null;
  notes: string | null;
};

export function AdminAcademySuggestionCard({
  suggestion,
}: {
  suggestion: Suggestion;
}) {
  const [state, action, pending] = useActionState(
    approveAcademySuggestionAction,
    initial,
  );

  if (state.success) {
    return (
      <article className="rounded-2xl border border-green-700/30 bg-[var(--card)] p-4">
        <p className="font-medium text-green-800 dark:text-green-300">
          {state.success}
        </p>
        {state.academySlug ? (
          <a
            href={`/academia/${state.academySlug}`}
            className="mt-2 inline-block text-sm underline"
          >
            Ver academia cadastrada
          </a>
        ) : null}
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <p className="text-[12px] font-semibold tracking-wide text-[var(--muted)] uppercase">
        Academia sugerida
      </p>
      <p className="mt-1 text-lg font-semibold">{suggestion.name}</p>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {[suggestion.cityText, suggestion.contact, suggestion.notes]
          .filter(Boolean)
          .join(" · ") || "Sem detalhes extras"}
      </p>

      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="id" value={suggestion.id} />
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Nome no cadastro
          <input
            name="name"
            required
            defaultValue={suggestion.name}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          WhatsApp / contato
          <input
            name="whatsapp"
            defaultValue={suggestion.contact ?? ""}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm text-[var(--muted)]">
            Endereço (opcional agora — você pode completar depois na lista de
            cadastradas). Cidade sugerida:{" "}
            <strong>{suggestion.cityText || "não informada"}</strong>
          </p>
          <AddressFields />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="acceptsVisitor" />
          Aceita visitante
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Cadastrando..." : "Aceitar e cadastrar academia"}
          </button>
        </div>
      </form>

      {state.error ? (
        <p className="mt-2 text-sm text-[var(--accent)]">{state.error}</p>
      ) : null}

      <form action={rejectAcademySuggestionAction} className="mt-3">
        <input type="hidden" name="id" value={suggestion.id} />
        <button
          type="submit"
          className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm"
        >
          Recusar sugestão
        </button>
      </form>
    </article>
  );
}
