"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import {
  createCompetitionAction,
  deleteCompetitionAction,
  toggleCompetitionHiddenAction,
  updateCompetitionAction,
  type CompetitionFormState,
} from "@/app/actions/competitions";
import { useLocale } from "@/components/locale-provider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Chip } from "@/components/ui/chip";
import { MedalPodium } from "@/components/ui/medal-podium";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import {
  competitionYears,
  filterCompetitions,
  formatEventDate,
  medalCounts,
  resultColor,
  type CompetitionRow,
} from "@/lib/competitions";

type ProfileBits = {
  belt: string;
  weightCategory?: string | null;
  name: string;
  cityName?: string | null;
};

export function CompetitionsPanel({
  initial,
  profile,
  publicMode = false,
}: {
  initial: CompetitionRow[];
  profile: ProfileBits;
  publicMode?: boolean;
}) {
  const { locale, t } = useLocale();
  const [rows, setRows] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(rows);
  const [year, setYear] = useState<string | "all">("all");
  const [modality, setModality] = useState<"all" | "GI" | "NOGI">("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<CompetitionRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const visibleBase = publicMode
    ? optimistic.filter((row) => !row.hidden)
    : optimistic;

  const filtered = useMemo(
    () => filterCompetitions(visibleBase, { year, modality }),
    [visibleBase, year, modality],
  );

  const podiumSource = publicMode
    ? visibleBase
    : visibleBase.filter((row) => !row.hidden);
  const counts = medalCounts(podiumSource);
  const years = competitionYears(visibleBase);

  function refreshFromServer(next: CompetitionRow[]) {
    setRows(next);
  }

  async function onToggleHidden(id: string) {
    startTransition(async () => {
      setOptimistic((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, hidden: !row.hidden } : row,
        ),
      );
      await toggleCompetitionHiddenAction(id);
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, hidden: !row.hidden } : row,
        ),
      );
    });
  }

  async function onDelete(id: string) {
    if (!window.confirm(t("compDeleteConfirm"))) return;
    startTransition(async () => {
      setOptimistic((prev) => prev.filter((row) => row.id !== id));
      await deleteCompetitionAction(id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    });
  }

  async function onSave(formData: FormData) {
    setFormError(null);
    const name = String(formData.get("name") || "").trim();
    const eventDate = String(formData.get("eventDate") || "").trim();
    if (!name || !eventDate) {
      setFormError(t("compFormError"));
      return;
    }

    const current = editing;
    const isEdit = Boolean(current);
    const tempId = current?.id || `tmp-${crypto.randomUUID()}`;
    const nextRow: CompetitionRow = {
      id: tempId,
      name,
      eventDate,
      city: String(formData.get("city") || "") || null,
      countryCode: null,
      federation: String(formData.get("federation") || "OTHER") as CompetitionRow["federation"],
      belt: String(formData.get("belt") || profile.belt),
      weightClass: String(formData.get("weightClass") || "") || null,
      ageClass: String(formData.get("ageClass") || "ADULT"),
      modality: String(formData.get("modality") || "GI") as CompetitionRow["modality"],
      isAbsolute: formData.get("isAbsolute") === "on",
      result: String(formData.get("result") || "PARTICIPATED") as CompetitionRow["result"],
      podiumPhotoUrl:
        String(formData.get("podiumPhotoUrl") || "") ||
        current?.podiumPhotoUrl ||
        null,
      bracketUrl: String(formData.get("bracketUrl") || "") || null,
      hidden: current?.hidden ?? false,
      verifiedAt: current?.verifiedAt ?? null,
      verifiedByProfessorId: current?.verifiedByProfessorId ?? null,
    };

    setSheetOpen(false);
    setEditing(null);

    startTransition(async () => {
      setOptimistic((prev) => {
        const without = prev.filter((row) => row.id !== tempId);
        return [nextRow, ...without].sort((a, b) =>
          b.eventDate.localeCompare(a.eventDate),
        );
      });
      setRows((prev) => {
        const without = prev.filter((row) => row.id !== tempId);
        return [nextRow, ...without].sort((a, b) =>
          b.eventDate.localeCompare(a.eventDate),
        );
      });

      if (isEdit && current) formData.set("id", current.id);
      const action = isEdit ? updateCompetitionAction : createCompetitionAction;
      const result: CompetitionFormState = await action({}, formData);
      if (result.error) {
        setFormError(result.error);
        setSheetOpen(true);
        setEditing(current);
        return;
      }

      const finalId = result.id || tempId;
      setRows((prev) => {
        const merged = prev.map((row) =>
          row.id === tempId ? { ...nextRow, id: finalId } : row,
        );
        refreshFromServer(merged);
        return merged;
      });
    });
  }

  return (
    <div className="flex flex-col gap-4 pb-24">
      <header className="overflow-hidden rounded-2xl bg-[var(--hero)] px-4 py-5 text-[#f1f0f4]">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-white/55 uppercase">
          {t("compHeroEyebrow")}
        </p>
        <h2 className="font-display mt-1 text-xl font-semibold">{profile.name}</h2>
        <p className="mt-1 text-[13px] text-white/70">
          {[t(`belt_${profile.belt}` as "belt_white"), profile.cityName]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      <MedalPodium counts={counts} />

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <Chip active={year === "all"} onClick={() => setYear("all")}>
          {t("compAllYears")}
        </Chip>
        {years.map((y) => (
          <Chip key={y} active={year === y} onClick={() => setYear(y)}>
            {y}
          </Chip>
        ))}
      </div>

      <SegmentedControl
        ariaLabel={t("compModalityFilter")}
        value={modality}
        onChange={setModality}
        options={[
          { value: "all", label: t("compModalityAll") },
          { value: "GI", label: t("filterGi") },
          { value: "NOGI", label: t("filterNogi") },
        ]}
      />

      {!filtered.length ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] px-3 py-8 text-center text-[13px] text-[var(--mute)]">
          {publicMode ? t("compEmptyPublic") : t("compEmpty")}
        </p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {filtered.map((row) => (
            <li
              key={row.id}
              className={`ui-card overflow-hidden ${row.hidden && !publicMode ? "opacity-55" : ""}`}
            >
              <div className="flex">
                <span
                  className="w-1.5 shrink-0"
                  style={{ background: resultColor(row.result) }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[14px] font-semibold tracking-tight">
                      {row.name}
                    </h3>
                    <span className="shrink-0 text-[12px] font-bold">
                      {t(`compResult_${row.result}` as "compResult_GOLD")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-[var(--mute)]">
                    {[formatEventDate(row.eventDate, locale), row.city]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Tag>{t(`compFed_${row.federation}` as "compFed_IBJJF")}</Tag>
                    <Tag>{t(`belt_${row.belt}` as "belt_white")}</Tag>
                    {row.weightClass ? <Tag>{row.weightClass}</Tag> : null}
                    <Tag>{t(`compAge_${row.ageClass}` as "compAge_ADULT")}</Tag>
                    <Tag>
                      {row.modality === "GI" ? t("filterGi") : t("filterNogi")}
                    </Tag>
                    {row.isAbsolute ? <Tag>{t("compAbsolute")}</Tag> : null}
                    {row.verifiedAt ? (
                      <Tag tone="ok">{t("compVerified")}</Tag>
                    ) : null}
                  </div>
                  {!publicMode ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-[12px] font-medium underline"
                        onClick={() => void onToggleHidden(row.id)}
                      >
                        {row.hidden ? t("compShow") : t("compHide")}
                      </button>
                      <button
                        type="button"
                        className="text-[12px] font-medium underline"
                        onClick={() => {
                          setEditing(row);
                          setSheetOpen(true);
                        }}
                      >
                        {t("compEdit")}
                      </button>
                      <button
                        type="button"
                        className="text-[12px] font-medium text-[var(--brand)] underline"
                        onClick={() => void onDelete(row.id)}
                      >
                        {t("compRemove")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {!publicMode ? (
        <>
          <StickyActionBar>
            <button
              type="button"
              className="ui-btn ui-btn-primary w-full sm:w-auto"
              onClick={() => {
                setEditing(null);
                setFormError(null);
                setSheetOpen(true);
              }}
            >
              {t("compAdd")}
            </button>
          </StickyActionBar>

          <BottomSheet
            open={sheetOpen}
            onClose={() => {
              setSheetOpen(false);
              setEditing(null);
            }}
            title={editing ? t("compEdit") : t("compAdd")}
          >
            <CompetitionForm
              key={editing?.id ?? "new"}
              profile={profile}
              initial={editing}
              error={formError}
              pending={pending}
              onSubmit={(fd) => void onSave(fd)}
            />
          </BottomSheet>
        </>
      ) : null}
    </div>
  );
}

function Tag({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "ok";
}) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
        tone === "ok"
          ? "bg-green-700/15 text-green-800 dark:text-green-300"
          : "border border-[var(--line)] text-[var(--mute)]"
      }`}
    >
      {children}
    </span>
  );
}

function CompetitionForm({
  profile,
  initial,
  error,
  pending,
  onSubmit,
}: {
  profile: ProfileBits;
  initial: CompetitionRow | null;
  error: string | null;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  const { t } = useLocale();
  const today = new Date().toISOString().slice(0, 10);
  const [modality, setModality] = useStateLocal(initial?.modality ?? "GI");
  const [result, setResult] = useStateLocal(initial?.result ?? "GOLD");
  const [podiumPhotoUrl, setPodiumPhotoUrl] = useState(
    initial?.podiumPhotoUrl ?? "",
  );

  return (
    <form
      className="flex flex-col gap-3"
      action={(formData) => {
        formData.set("modality", modality);
        formData.set("result", result);
        if (podiumPhotoUrl) formData.set("podiumPhotoUrl", podiumPhotoUrl);
        onSubmit(formData);
      }}
    >
      <label className="flex flex-col gap-1 text-[13px]">
        {t("compName")}
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className="ui-input"
        />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        {t("compDate")}
        <input
          name="eventDate"
          type="date"
          required
          defaultValue={initial?.eventDate ?? today}
          className="ui-input"
        />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        {t("city")}
        <input
          name="city"
          defaultValue={initial?.city ?? profile.cityName ?? ""}
          className="ui-input"
        />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        {t("compFederation")}
        <select
          name="federation"
          defaultValue={initial?.federation ?? "IBJJF"}
          className="ui-input"
        >
          {(["CBJJ", "IBJJF", "CBJJO", "STATE", "LOCAL", "OTHER"] as const).map(
            (value) => (
              <option key={value} value={value}>
                {t(`compFed_${value}` as "compFed_IBJJF")}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        {t("belt")}
        <select
          name="belt"
          defaultValue={initial?.belt ?? profile.belt}
          className="ui-input"
        >
          {(
            [
              "white",
              "blue",
              "purple",
              "brown",
              "black",
              "gray",
              "yellow",
              "orange",
              "green",
            ] as const
          ).map((value) => (
            <option key={value} value={value}>
              {t(`belt_${value}` as "belt_white")}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        {t("weightCategory")}
        <input
          name="weightClass"
          defaultValue={
            initial?.weightClass ?? profile.weightCategory ?? ""
          }
          className="ui-input"
        />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        {t("compAge")}
        <select
          name="ageClass"
          defaultValue={initial?.ageClass ?? "ADULT"}
          className="ui-input"
        >
          {(
            [
              "ADULT",
              "MASTER1",
              "MASTER2",
              "MASTER3",
              "MASTER4",
              "MASTER5",
              "MASTER6",
              "MASTER7",
              "JUVENILE",
              "OTHER",
            ] as const
          ).map((value) => (
            <option key={value} value={value}>
              {t(`compAge_${value}` as "compAge_ADULT")}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-[13px]">{t("modality")}</span>
        <SegmentedControl
          ariaLabel={t("modality")}
          value={modality}
          onChange={setModality}
          options={[
            { value: "GI", label: t("filterGi") },
            { value: "NOGI", label: t("filterNogi") },
          ]}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[13px] font-medium">{t("compResult")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(
            ["GOLD", "SILVER", "BRONZE", "PARTICIPATED"] as const
          ).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={result === value}
              onClick={() => setResult(value)}
              className={`min-h-11 rounded-xl border px-2 text-[12px] font-semibold ${
                result === value
                  ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                  : "border-[var(--line)]"
              }`}
            >
              {t(`compResult_${value}` as "compResult_GOLD")}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          name="isAbsolute"
          defaultChecked={initial?.isAbsolute}
        />
        {t("compAbsoluteAlso")}
      </label>

      <label className="flex flex-col gap-1 text-[13px]">
        {t("compPodiumPhoto")}
        <input
          type="file"
          accept="image/*"
          className="ui-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              setPodiumPhotoUrl(initial?.podiumPhotoUrl ?? "");
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              setPodiumPhotoUrl(String(reader.result || ""));
            };
            reader.readAsDataURL(file);
          }}
        />
      </label>

      <label className="flex flex-col gap-1 text-[13px]">
        {t("compBracketUrl")}
        <input
          name="bracketUrl"
          type="url"
          defaultValue={initial?.bracketUrl ?? ""}
          className="ui-input"
          placeholder="https://"
        />
      </label>

      {error ? (
        <p className="text-[13px] text-[var(--brand)]">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="ui-btn ui-btn-primary disabled:opacity-60"
      >
        {pending ? t("saving") : t("saveProfile")}
      </button>
    </form>
  );
}

function useStateLocal<T>(value: T) {
  return useState(value);
}
