"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import {
  linkProfessorBySlugAction,
  respondProfessorLinkAction,
  type LinkProfessorState,
} from "@/app/actions/academy-professor";

const initial: LinkProfessorState = {};

type ProfessorRow = {
  linkId: string;
  profileId: string;
  name: string;
  slug: string;
  status: "active" | "pending" | "left";
};

export function AcademyProfessorPanel({
  academyId,
  professors,
}: {
  academyId: string;
  professors: ProfessorRow[];
}) {
  const [linkState, linkAction, linkPending] = useActionState(
    linkProfessorBySlugAction,
    initial,
  );
  const [respondState, respondAction, respondPending] = useActionState(
    respondProfessorLinkAction,
    initial,
  );

  const active = professors.filter((row) => row.status === "active");
  const pending = professors.filter((row) => row.status === "pending");

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] p-4">
      <Section>
        <div>
          <h2 className="text-xl font-semibold">Professores</h2>
          <p className="text-sm text-[var(--muted)]">
            Vincule pelo link do perfil do professor ou aprove solicitações.
          </p>
        </div>

        <form action={linkAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="academyId" value={academyId} />
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Link do professor
            <input
              name="professorSlug"
              placeholder="ex.: joao-silva"
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              required
            />
          </label>
          <button
            type="submit"
            disabled={linkPending}
            className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm font-medium disabled:opacity-60"
          >
            {linkPending ? "..." : "Vincular"}
          </button>
        </form>
        {linkState.error ? (
          <p className="text-sm text-[var(--accent)]">{linkState.error}</p>
        ) : null}
        {linkState.success ? (
          <p className="text-sm text-green-700">{linkState.success}</p>
        ) : null}
      </Section>

      {pending.length ? (
        <Section>
          <h3 className="font-medium">Solicitações pendentes</h3>
          <ul className="flex flex-col gap-2">
            {pending.map((row) => (
              <li
                key={row.linkId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2"
              >
                <span className="text-sm">
                  {row.name}{" "}
                  <span className="text-[var(--muted)]">/{row.slug}</span>
                </span>
                <form action={respondAction} className="flex gap-2">
                  <input type="hidden" name="linkId" value={row.linkId} />
                  <button
                    type="submit"
                    name="decision"
                    value="approve"
                    disabled={respondPending}
                    className="text-sm font-medium text-green-700 underline"
                  >
                    Aprovar
                  </button>
                  <button
                    type="submit"
                    name="decision"
                    value="reject"
                    disabled={respondPending}
                    className="text-sm text-[var(--accent)] underline"
                  >
                    Recusar
                  </button>
                </form>
              </li>
            ))}
          </ul>
          {respondState.error ? (
            <p className="text-sm text-[var(--accent)]">{respondState.error}</p>
          ) : null}
          {respondState.success ? (
            <p className="text-sm text-green-700">{respondState.success}</p>
          ) : null}
        </Section>
      ) : null}

      <Section>
        <h3 className="font-medium">Vinculados</h3>
        {active.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhum professor vinculado.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {active.map((row) => (
              <li
                key={row.profileId}
                className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
              >
                {row.name}{" "}
                <span className="text-[var(--muted)]">/atleta/{row.slug}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </section>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}