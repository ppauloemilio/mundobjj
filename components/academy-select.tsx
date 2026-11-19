"use client";

import { useEffect, useState } from "react";

type AcademyOption = { id: string; name: string; city: string | null };

const OTHER = "__other__";

export function AcademySelect({
  initialAcademyId = "",
  required = false,
  onAcademyIdChange,
}: {
  initialAcademyId?: string;
  required?: boolean;
  onAcademyIdChange?: (academyId: string) => void;
}) {
  const [academies, setAcademies] = useState<AcademyOption[]>([]);
  const [value, setValue] = useState(initialAcademyId || "");
  const [otherName, setOtherName] = useState("");
  const isOther = value === OTHER;

  useEffect(() => {
    void fetch("/api/academies")
      .then((response) => response.json())
      .then((data: { academies: AcademyOption[] }) =>
        setAcademies(data.academies ?? []),
      );
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm">
        Academia
        <select
          name={isOther ? undefined : "academyId"}
          value={value}
          required={required}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            onAcademyIdChange?.(next === OTHER ? "" : next);
          }}
          className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
        >
          <option value="">Selecione</option>
          {academies.map((academy) => (
            <option key={academy.id} value={academy.id}>
              {academy.name}
              {academy.city ? ` · ${academy.city}` : ""}
            </option>
          ))}
          <option value={OTHER}>Outro (ainda não cadastrada)</option>
        </select>
      </label>
      {isOther ? (
        <label className="flex flex-col gap-1 text-sm">
          Nome da academia
          <input
            name="suggestedAcademyName"
            value={otherName}
            onChange={(event) => setOtherName(event.target.value)}
            required={required}
            placeholder="Ex.: Alliance Centro"
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
          <span className="text-xs text-[var(--muted)]">
            O admin poderá contatar essa academia para oferecer o cadastro.
          </span>
        </label>
      ) : null}
      <input type="hidden" name="academyMode" value={isOther ? "other" : "list"} />
    </div>
  );
}
