import { desc, eq } from "drizzle-orm";
import {
  approveAcademySuggestionAction,
  approveLocationSuggestionAction,
  approveProfessorSuggestionAction,
  rejectAcademySuggestionAction,
  rejectLocationSuggestionAction,
  rejectProfessorSuggestionAction,
} from "@/app/actions/suggestions";
import { requireDb } from "@/db";
import {
  academySuggestions,
  locationSuggestions,
  professorSuggestions,
} from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminSugestoesPage() {
  await requireAdmin();
  const db = requireDb();

  const [locations, academies, professors] = await Promise.all([
    db
      .select()
      .from(locationSuggestions)
      .where(eq(locationSuggestions.status, "pending"))
      .orderBy(desc(locationSuggestions.createdAt)),
    db
      .select()
      .from(academySuggestions)
      .where(eq(academySuggestions.status, "pending"))
      .orderBy(desc(academySuggestions.createdAt)),
    db
      .select()
      .from(professorSuggestions)
      .where(eq(professorSuggestions.status, "pending"))
      .orderBy(desc(professorSuggestions.createdAt)),
  ]);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Locais (país, estado, cidade)</h2>
        {locations.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma sugestão pendente.</p>
        ) : (
          locations.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"
            >
              <p className="font-medium">
                {item.kind === "country"
                  ? "País"
                  : item.kind === "state"
                    ? "Estado"
                    : "Cidade"}
                : {item.name}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {[item.countryName || item.countryIso2, item.stateName]
                  .filter(Boolean)
                  .join(" · ") || "Sem contexto extra"}
              </p>
              <div className="mt-3 flex gap-2">
                <form action={approveLocationSuggestionAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-white"
                  >
                    Aprovar
                  </button>
                </form>
                <form action={rejectLocationSuggestionAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm"
                  >
                    Recusar
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Academias sugeridas</h2>
        <p className="text-sm text-[var(--muted)]">
          Alunos que não acharam a academia na lista. Use para contatar e
          oferecer o cadastro.
        </p>
        {academies.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma sugestão pendente.</p>
        ) : (
          academies.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"
            >
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {[item.cityText, item.contact].filter(Boolean).join(" · ") ||
                  "Sem contato extra"}
              </p>
              <div className="mt-3 flex gap-2">
                <form action={approveAcademySuggestionAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-white"
                  >
                    Marcar como tratada
                  </button>
                </form>
                <form action={rejectAcademySuggestionAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm"
                  >
                    Recusar
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Professores sugeridos</h2>
        <p className="text-sm text-[var(--muted)]">
          Nomes informados como &quot;Outro&quot; no cadastro da academia.
          Aprove para confirmar na ficha ou contate para criar conta de
          professor.
        </p>
        {professors.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nenhuma sugestão pendente.</p>
        ) : (
          professors.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"
            >
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {[item.academyName, item.contact].filter(Boolean).join(" · ") ||
                  "Sem academia/contato extra"}
              </p>
              <div className="mt-3 flex gap-2">
                <form action={approveProfessorSuggestionAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-white"
                  >
                    Aprovar
                  </button>
                </form>
                <form action={rejectProfessorSuggestionAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm"
                  >
                    Recusar
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
