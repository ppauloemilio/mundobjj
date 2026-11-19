"use client";

import { useEffect, useState } from "react";

type ProfessorOption = { id: string; name: string; slug: string };

export function ProfessorSelect({
  academyId,
  initialProfessorId = "",
  required = false,
}: {
  academyId: string;
  initialProfessorId?: string;
  required?: boolean;
}) {
  const [professors, setProfessors] = useState<ProfessorOption[]>([]);
  const [value, setValue] = useState(initialProfessorId);

  useEffect(() => {
    setValue(initialProfessorId);
  }, [initialProfessorId, academyId]);

  useEffect(() => {
    if (!academyId) {
      setProfessors([]);
      return;
    }
    void fetch(`/api/academies/${academyId}/professors`)
      .then((response) => response.json())
      .then((data: { professors: ProfessorOption[] }) =>
        setProfessors(data.professors ?? []),
      );
  }, [academyId]);

  if (!academyId) return null;

  return (
    <label className="flex flex-col gap-1 text-sm">
      Professor
      <select
        name="professorProfileId"
        value={value}
        required={required && professors.length > 0}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
      >
        <option value="">
          {professors.length ? "Selecione (opcional)" : "Nenhum professor cadastrado ainda"}
        </option>
        {professors.map((professor) => (
          <option key={professor.id} value={professor.id}>
            {professor.name}
          </option>
        ))}
      </select>
      {professors.length === 0 ? (
        <span className="text-xs text-[var(--muted)]">
          A academia ainda precisa vincular professores no painel.
        </span>
      ) : null}
    </label>
  );
}