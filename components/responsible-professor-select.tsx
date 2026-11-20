"use client";

import { useEffect, useState } from "react";

type ProfessorOption = { id: string; name: string; slug: string };

const OTHER = "__other__";

export function ResponsibleProfessorSelect({
  initialProfessorProfileId = "",
  initialProfessorName = "",
  required = false,
}: {
  initialProfessorProfileId?: string;
  initialProfessorName?: string;
  required?: boolean;
}) {
  const [professors, setProfessors] = useState<ProfessorOption[]>([]);
  const matched = professors.find(
    (row) =>
      row.id === initialProfessorProfileId ||
      (!initialProfessorProfileId &&
        initialProfessorName &&
        row.name === initialProfessorName),
  );
  const [value, setValue] = useState(
    matched?.id || (initialProfessorName ? OTHER : ""),
  );
  const [otherName, setOtherName] = useState(
    matched ? "" : initialProfessorName || "",
  );
  const isOther = value === OTHER;

  useEffect(() => {
    void fetch("/api/professors")
      .then((response) => response.json())
      .then((data: { professors: ProfessorOption[] }) => {
        const list = data.professors ?? [];
        setProfessors(list);
        const found = list.find(
          (row) =>
            row.id === initialProfessorProfileId ||
            (!initialProfessorProfileId &&
              initialProfessorName &&
              row.name === initialProfessorName),
        );
        if (found) {
          setValue(found.id);
          setOtherName("");
        } else if (initialProfessorName) {
          setValue(OTHER);
          setOtherName(initialProfessorName);
        }
      });
  }, [initialProfessorName, initialProfessorProfileId]);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Professor responsável
        <select
          name={isOther ? undefined : "professorProfileId"}
          value={value}
          required={required}
          onChange={(event) => setValue(event.target.value)}
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        >
          <option value="">Selecione</option>
          {professors.map((professor) => (
            <option key={professor.id} value={professor.id}>
              {professor.name}
            </option>
          ))}
          <option value={OTHER}>Outro (ainda não cadastrado)</option>
        </select>
      </label>
      {isOther ? (
        <label className="flex flex-col gap-1 text-sm">
          Nome do professor
          <input
            name="suggestedProfessorName"
            value={otherName}
            onChange={(event) => setOtherName(event.target.value)}
            required={required}
            placeholder="Ex.: João Silva"
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
          <span className="text-xs text-[var(--muted)]">
            Vai para aprovação do admin. Depois o professor pode criar conta e
            se vincular.
          </span>
        </label>
      ) : null}
      <input
        type="hidden"
        name="professorMode"
        value={isOther ? "other" : "list"}
      />
    </div>
  );
}