"use client";

import { useActionState, useState } from "react";
import {
  saveAcademyAction,
  type AcademyFormState,
} from "@/app/actions/academy";
import { LocationFields } from "@/components/location-fields";
import { ResponsibleProfessorSelect } from "@/components/responsible-professor-select";
import { classKindLabel } from "@/lib/labels";

const initial: AcademyFormState = {};

const weekdays = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

type ScheduleRow = {
  weekday: number;
  startsAt: string;
  endsAt: string;
  kind: string;
  level: string;
  professorProfileId: string;
};

type ProfessorOption = { id: string; name: string };

type AcademyValues = {
  id?: string;
  name: string;
  affiliation: string | null;
  professorName: string | null;
  whatsapp: string | null;
  address: string | null;
  neighborhood: string | null;
  cityId: string | null;
  acceptsVisitor: boolean;
  dropInPrice: string | null;
  visitorNotes: string | null;
  schedules: ScheduleRow[];
};

export function AcademyForm({
  academy,
  professors = [],
}: {
  academy?: AcademyValues;
  professors?: ProfessorOption[];
}) {
  const [state, action, pending] = useActionState(saveAcademyAction, initial);
  const [schedules, setSchedules] = useState<ScheduleRow[]>(
    academy?.schedules.length
      ? academy.schedules
      : [
          {
            weekday: 1,
            startsAt: "19:00",
            endsAt: "20:30",
            kind: "gi",
            level: "Todas as faixas",
            professorProfileId: "",
          },
        ],
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {academy?.id ? <input type="hidden" name="id" value={academy.id} /> : null}
      <Field label="Nome da academia" name="name" defaultValue={academy?.name} required />
      <Field
        label="Equipe / afiliação"
        name="affiliation"
        defaultValue={academy?.affiliation ?? ""}
      />
      <ResponsibleProfessorSelect
        initialProfessorName={academy?.professorName ?? ""}
      />
      <Field label="WhatsApp" name="whatsapp" defaultValue={academy?.whatsapp ?? ""} />
      <Field
        label="Endereço"
        name="address"
        defaultValue={academy?.address ?? ""}
        required
      />
      <Field
        label="Bairro"
        name="neighborhood"
        defaultValue={academy?.neighborhood ?? ""}
      />
      <LocationFields initialCityId={academy?.cityId ?? ""} required />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="acceptsVisitor"
          defaultChecked={academy?.acceptsVisitor ?? true}
        />
        Aceita visitante
      </label>
      <Field
        label="Valor do drop-in"
        name="dropInPrice"
        defaultValue={academy?.dropInPrice ?? ""}
      />
      <label className="flex flex-col gap-1 text-sm">
        Observações para visitantes
        <textarea
          name="visitorNotes"
          defaultValue={academy?.visitorNotes ?? ""}
          rows={3}
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2"
        />
      </label>

      <div className="rounded-2xl border border-[var(--line)] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold">Grade de horários</h2>
          <button
            type="button"
            onClick={() =>
              setSchedules((current) => [
                ...current,
                {
                  weekday: 1,
                  startsAt: "19:00",
                  endsAt: "20:30",
                  kind: "gi",
                  level: "",
                  professorProfileId: "",
                },
              ])
            }
            className="text-sm font-medium underline"
          >
            Adicionar aula
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {schedules.map((schedule, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-xl border border-[var(--line)] p-3 sm:grid-cols-2"
            >
              <label className="flex flex-col gap-1 text-sm">
                Dia
                <select
                  name="scheduleWeekday"
                  value={schedule.weekday}
                  onChange={(event) =>
                    setSchedules((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, weekday: Number(event.target.value) }
                          : row,
                      ),
                    )
                  }
                  className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                >
                  {weekdays.map((label, weekday) => (
                    <option key={label} value={weekday}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Tipo
                <select
                  name="scheduleKind"
                  value={schedule.kind}
                  onChange={(event) =>
                    setSchedules((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, kind: event.target.value }
                          : row,
                      ),
                    )
                  }
                  className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                >
                  {Object.entries(classKindLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Início
                <input
                  name="scheduleStartsAt"
                  type="time"
                  value={schedule.startsAt}
                  onChange={(event) =>
                    setSchedules((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, startsAt: event.target.value }
                          : row,
                      ),
                    )
                  }
                  className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Fim
                <input
                  name="scheduleEndsAt"
                  type="time"
                  value={schedule.endsAt}
                  onChange={(event) =>
                    setSchedules((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? { ...row, endsAt: event.target.value }
                          : row,
                      ),
                    )
                  }
                  className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                />
              </label>
              <input
                name="scheduleLevel"
                value={schedule.level}
                onChange={(event) =>
                  setSchedules((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, level: event.target.value }
                        : row,
                    ),
                  )
                }
                placeholder="Nível"
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3 sm:col-span-1"
              />
              {professors.length ? (
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  Professor da aula
                  <select
                    name="scheduleProfessorProfileId"
                    value={schedule.professorProfileId}
                    onChange={(event) =>
                      setSchedules((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index
                            ? {
                                ...row,
                                professorProfileId: event.target.value,
                              }
                            : row,
                        ),
                      )
                    }
                    className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                  >
                    <option value="">Selecione</option>
                    {professors.map((professor) => (
                      <option key={professor.id} value={professor.id}>
                        {professor.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="text-sm text-[var(--muted)] sm:col-span-2">
                  Vincule professores abaixo para escolher na grade.
                </p>
              )}
              <button
                type="button"
                onClick={() =>
                  setSchedules((current) => current.filter((_, rowIndex) => rowIndex !== index))
                }
                className="text-left text-sm text-[var(--accent)] underline sm:col-span-2"
              >
                Remover aula
              </button>
            </div>
          ))}
        </div>
      </div>

      {state.error ? <p className="text-sm text-[var(--accent)]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-[var(--accent)] px-5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Salvando..." : academy?.id ? "Atualizar academia" : "Cadastrar academia"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
      />
    </label>
  );
}
