"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";

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
  const { t } = useLocale();
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
      <label className="flex flex-col gap-1 text-[13px]">
        {t("academyLabel")}
        <select
          name={isOther ? undefined : "academyId"}
          value={value}
          required={required}
          onChange={(event) => {
            const next = event.target.value;
            setValue(next);
            onAcademyIdChange?.(next === OTHER ? "" : next);
          }}
          className="ui-input"
        >
          <option value="">{t("searchSelect")}</option>
          {academies.map((academy) => (
            <option key={academy.id} value={academy.id}>
              {academy.name}
              {academy.city ? ` · ${academy.city}` : ""}
            </option>
          ))}
          <option value={OTHER}>{t("academyNotFound")}</option>
        </select>
      </label>
      {isOther ? (
        <label className="flex flex-col gap-1 text-[13px]">
          {t("academyName")}
          <input
            name="suggestedAcademyName"
            value={otherName}
            onChange={(event) => setOtherName(event.target.value)}
            required={required}
            className="ui-input"
          />
          <span className="text-[11px] text-[var(--mute)]">
            {t("academySuggestHint")}
          </span>
        </label>
      ) : null}
      <input type="hidden" name="academyMode" value={isOther ? "other" : "list"} />
    </div>
  );
}
