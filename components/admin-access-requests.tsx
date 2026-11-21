"use client";

import { useActionState, useEffect } from "react";
import {
  approveAcademyAccessAction,
  rejectAcademyAccessAction,
  type AccessFormState,
} from "@/app/actions/academy-access";

const initial: AccessFormState = {};

type RequestRow = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  message: string | null;
  academyName: string;
  academySlug: string;
};

export function AdminAccessRequests({ requests }: { requests: RequestRow[] }) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Nenhuma solicitação de acesso pendente.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {requests.map((request) => (
        <AccessRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}

function AccessRequestCard({ request }: { request: RequestRow }) {
  const [state, action, pending] = useActionState(
    approveAcademyAccessAction,
    initial,
  );

  useEffect(() => {
    if (state.whatsappUrl) {
      window.open(state.whatsappUrl, "_blank", "noopener,noreferrer");
    }
  }, [state.whatsappUrl, state.temporaryPassword]);

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <p className="font-semibold">{request.academyName}</p>
      <p className="text-sm text-[var(--muted)]">
        {request.name} · {request.email}
        {request.whatsapp ? ` · ${request.whatsapp}` : ""}
      </p>
      {request.message ? (
        <p className="mt-2 text-sm">{request.message}</p>
      ) : null}
      <a
        href={`/academia/${request.academySlug}`}
        className="mt-2 inline-block text-sm underline"
      >
        Ver ficha pública
      </a>

      <div className="mt-4 grid gap-3">
        <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="requestId" value={request.id} />
          <input type="hidden" name="mode" value="manual" />
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Senha escolhida pelo admin
            <input
              name="password"
              minLength={8}
              required
              placeholder="Definir senha"
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm disabled:opacity-60"
          >
            {pending ? "..." : "Aprovar com esta senha"}
          </button>
        </form>

        <form action={action}>
          <input type="hidden" name="requestId" value={request.id} />
          <input type="hidden" name="mode" value="random" />
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending
              ? "Gerando..."
              : "Aprovar com senha aleatória e abrir WhatsApp"}
          </button>
        </form>

        <form action={rejectAcademyAccessAction}>
          <input type="hidden" name="requestId" value={request.id} />
          <button type="submit" className="text-sm text-[var(--accent)] underline">
            Recusar solicitação
          </button>
        </form>
      </div>

      {state.error ? (
        <p className="mt-2 text-sm text-[var(--accent)]">{state.error}</p>
      ) : null}
      {state.temporaryPassword ? (
        <div className="mt-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm">
          {state.success ? <p>{state.success}</p> : null}
          <p>
            Senha: <strong>{state.temporaryPassword}</strong>
          </p>
          {state.whatsappUrl ? (
            <a
              href={state.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Abrir WhatsApp novamente
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}