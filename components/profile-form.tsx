"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  completeOnboardingAction,
  updateProfileAction,
  type ProfileFormState,
} from "@/app/actions/profile";
import { AcademySelect } from "@/components/academy-select";
import { BeltRankVisual } from "@/components/belt-rank-visual";
import { LocationFields } from "@/components/location-fields";
import { useLocale } from "@/components/locale-provider";
import { ProfessorSelect } from "@/components/professor-select";
import { StickyActionBar } from "@/components/ui/sticky-action-bar";
import { Switch } from "@/components/ui/switch";
import {
  adultBeltColors,
  formatWhatsappDisplay,
  kidBeltColors,
  maskWhatsappInput,
  weightCategories,
  weightCategoryLabel,
} from "@/lib/profile-display";

const initial: ProfileFormState = {};

const adultBelts = ["white", "blue", "purple", "brown", "black"] as const;
const kidBelts = ["gray", "yellow", "orange", "green"] as const;

type ProfileValues = {
  name: string;
  slug: string;
  cityId: string | null;
  countryIso2?: string | null;
  stateCode?: string | null;
  cityName?: string | null;
  academyId: string | null;
  professorProfileId: string | null;
  belt: string;
  stripes: number;
  style: string;
  competitor: boolean;
  bio: string | null;
  weightKg: string | null;
  weightCategory?: string | null;
  avatarUrl?: string | null;
  startedAt: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
  accountEmail?: string | null;
  showWhatsapp: boolean;
  showEmail: boolean;
};

type SectionId = "dados" | "local" | "treino" | "contato" | "privacidade";

export function ProfileForm({
  profile,
  hideAcademyFields = false,
  showHomeCta = false,
}: {
  profile: ProfileValues;
  hideAcademyFields?: boolean;
  showHomeCta?: boolean;
}) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const [academyId, setAcademyId] = useState(profile.academyId ?? "");
  const [slug, setSlug] = useState(profile.slug);
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [belt, setBelt] = useState(profile.belt);
  const [stripes, setStripes] = useState(profile.stripes);
  const [style, setStyle] = useState(profile.style);
  const [weightKg, setWeightKg] = useState(profile.weightKg ?? "");
  const [weightCategory, setWeightCategory] = useState(
    profile.weightCategory ?? "",
  );
  const [startedAt, setStartedAt] = useState(profile.startedAt ?? "");
  const [whatsapp, setWhatsapp] = useState(
    formatWhatsappDisplay(profile.whatsapp) || "",
  );
  const [contactEmail, setContactEmail] = useState(
    profile.contactEmail?.trim() || profile.accountEmail?.trim() || "",
  );
  const [showWhatsapp, setShowWhatsapp] = useState(profile.showWhatsapp);
  const [showEmail, setShowEmail] = useState(profile.showEmail);
  const [competitor, setCompetitor] = useState(profile.competitor);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    dados: true,
    local: true,
    treino: true,
    contato: true,
    privacidade: true,
  });
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  const sections: { id: SectionId; label: string }[] = [
    { id: "dados", label: t("sectionData") },
    { id: "local", label: t("sectionLocation") },
    { id: "treino", label: t("sectionTraining") },
    { id: "contato", label: t("sectionContact") },
    { id: "privacidade", label: t("sectionPrivacy") },
  ];

  function markDirty() {
    setDirty(true);
  }

  useEffect(() => {
    if (state.success && state.savedAt) {
      setDirty(false);
      router.refresh();
    }
  }, [state.success, state.savedAt, router]);

  useEffect(() => {
    const normalized = slug.trim().toLowerCase();
    if (!normalized || normalized === profile.slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timer = window.setTimeout(() => {
      void fetch(`/api/profile/slug?slug=${encodeURIComponent(normalized)}`)
        .then((response) => response.json())
        .then(
          (data: {
            available: boolean;
            reason?: "invalid" | "taken" | null;
          }) => {
            if (data.reason === "invalid") setSlugStatus("invalid");
            else if (data.available) setSlugStatus("available");
            else setSlugStatus("taken");
          },
        )
        .catch(() => setSlugStatus("idle"));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [slug, profile.slug]);

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await compressImage(file);
    setAvatarUrl(dataUrl);
    markDirty();
  }

  const bioCount = useMemo(() => bio.length, [bio]);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {showHomeCta ? (
        <div className="ui-card flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[var(--mute)]">{t("onboardingHint")}</p>
          <form
            action={async () => {
              await completeOnboardingAction();
              router.push("/");
            }}
          >
            <button type="submit" className="ui-btn ui-btn-primary">
              {t("goToSearch")}
            </button>
          </form>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/atleta/${profile.slug}`}
          className="text-[13px] text-[var(--mute)] underline"
        >
          /atleta/{profile.slug}
        </Link>
        <Link
          href="/painel/configuracoes"
          className="text-[13px] font-medium underline"
        >
          {t("settingsLink")}
        </Link>
      </div>

      <nav
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        aria-label={t("sectionNav")}
      >
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#section-${section.id}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-[var(--line)] bg-[var(--card)] px-3 text-[12px] font-semibold text-[var(--ink)]"
          >
            {section.label}
          </a>
        ))}
      </nav>

      <form
        action={action}
        onChange={markDirty}
        className="flex flex-col gap-3"
      >
        <input type="hidden" name="avatarUrl" value={avatarUrl} />
        <input type="hidden" name="belt" value={belt} />
        <input type="hidden" name="stripes" value={stripes} />
        <input type="hidden" name="style" value={style} />
        <input type="hidden" name="whatsapp" value={whatsapp} />
        {showWhatsapp ? <input type="hidden" name="showWhatsapp" value="on" /> : null}
        {showEmail ? <input type="hidden" name="showEmail" value="on" /> : null}

        <Section
          id="dados"
          title={t("sectionData")}
          open={open.dados}
          onToggle={() => setOpen((s) => ({ ...s, dados: !s.dados }))}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
              <label className="flex w-full flex-col items-center gap-2">
                <span className="text-[13px]">{t("profilePhoto")}</span>
                <span className="relative inline-flex h-20 w-20 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-bold text-[var(--brand)]">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="text-[12px]"
                  onChange={(event) =>
                    void onAvatarChange(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              <BeltRankVisual
                belt={belt}
                stripes={stripes}
                size="md"
                label={t(`belt_${belt}` as "belt_white")}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <label className="flex flex-col gap-1 text-[13px]">
                {t("name")}
                <input
                  name="name"
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    markDirty();
                  }}
                  className="ui-input"
                />
              </label>
              <label className="flex flex-col gap-1 text-[13px]">
                {t("profileLink")}
                <input
                  name="slug"
                  required
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    markDirty();
                  }}
                  className="ui-input"
                />
                {slugStatus === "checking" ? (
                  <span className="text-[11px] text-[var(--mute)]">
                    {t("slugChecking")}
                  </span>
                ) : null}
                {slugStatus === "available" ? (
                  <span className="text-[11px] text-green-700">
                    {t("slugAvailable")}
                  </span>
                ) : null}
                {slugStatus === "taken" ? (
                  <span className="text-[11px] text-[var(--brand)]">
                    {t("slugTaken")}
                  </span>
                ) : null}
              </label>
              <label className="flex flex-col gap-1 text-[13px]">
                {t("bio")}
                <textarea
                  name="bio"
                  value={bio}
                  maxLength={500}
                  rows={3}
                  onChange={(event) => {
                    setBio(event.target.value);
                    markDirty();
                  }}
                  className="ui-input min-h-[5rem] py-2"
                />
                <span className="text-[11px] text-[var(--mute)]">
                  {bioCount}/500
                </span>
              </label>
            </div>
          </div>
        </Section>

        <Section
          id="local"
          title={t("sectionLocation")}
          open={open.local}
          onToggle={() => setOpen((s) => ({ ...s, local: !s.local }))}
        >
          <LocationFields
            initialCountryIso2={profile.countryIso2 ?? ""}
            initialStateCode={profile.stateCode ?? ""}
            initialCityName={profile.cityName ?? ""}
          />
        </Section>

        <Section
          id="treino"
          title={t("sectionTraining")}
          open={open.treino}
          onToggle={() => setOpen((s) => ({ ...s, treino: !s.treino }))}
        >
          {hideAcademyFields ? null : (
            <>
              <AcademySelect
                initialAcademyId={profile.academyId ?? ""}
                onAcademyIdChange={setAcademyId}
              />
              <ProfessorSelect
                academyId={academyId}
                initialProfessorId={profile.professorProfileId ?? ""}
              />
            </>
          )}

          <fieldset className="flex flex-col gap-2">
            <legend className="text-[13px] font-medium">{t("belt")}</legend>
            <div className="flex flex-wrap gap-2">
              {adultBelts.map((value) => (
                <BeltSwatch
                  key={value}
                  value={value}
                  label={t(`belt_${value}` as "belt_white")}
                  color={adultBeltColors[value]}
                  selected={belt === value}
                  onSelect={() => {
                    setBelt(value);
                    markDirty();
                  }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {kidBelts.map((value) => (
                <BeltSwatch
                  key={value}
                  value={value}
                  label={t(`belt_${value}` as "belt_gray")}
                  color={kidBeltColors[value]}
                  selected={belt === value}
                  onSelect={() => {
                    setBelt(value);
                    markDirty();
                  }}
                />
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1">
            <span className="text-[13px]">{t("stripes")}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="ui-btn min-h-11 min-w-11 border border-[var(--line)]"
                aria-label={t("stripesDown")}
                onClick={() => {
                  setStripes((n) => Math.max(0, n - 1));
                  markDirty();
                }}
              >
                −
              </button>
              <span className="min-w-8 text-center text-[15px] font-semibold">
                {stripes}
              </span>
              <button
                type="button"
                className="ui-btn min-h-11 min-w-11 border border-[var(--line)]"
                aria-label={t("stripesUp")}
                onClick={() => {
                  setStripes((n) => Math.min(4, n + 1));
                  markDirty();
                }}
              >
                +
              </button>
            </div>
          </div>

          <label className="flex flex-col gap-1 text-[13px]">
            {t("modality")}
            <select
              value={style}
              onChange={(event) => {
                setStyle(event.target.value);
                markDirty();
              }}
              className="ui-input"
            >
              <option value="both">{t("styleBoth")}</option>
              <option value="gi">{t("styleGi")}</option>
              <option value="nogi">{t("styleNogi")}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[13px]">
            {t("startedAt")}
            <input
              name="startedAt"
              type="date"
              value={startedAt}
              onChange={(event) => {
                setStartedAt(event.target.value);
                markDirty();
              }}
              className="ui-input"
            />
          </label>

          <label className="flex flex-col gap-1 text-[13px]">
            {t("weightCategory")}
            <select
              name="weightCategory"
              value={weightCategory}
              onChange={(event) => {
                setWeightCategory(event.target.value);
                markDirty();
              }}
              className="ui-input"
            >
              <option value="">{t("searchSelect")}</option>
              {weightCategories.map((value) => (
                <option key={value} value={value}>
                  {weightCategoryLabel(value, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[13px]">
            {t("weightKgPrivate")}
            <input
              name="weightKg"
              value={weightKg}
              onChange={(event) => {
                setWeightKg(event.target.value);
                markDirty();
              }}
              className="ui-input"
              inputMode="decimal"
            />
            <span className="text-[11px] text-[var(--mute)]">
              {t("weightKgHint")}
            </span>
          </label>
        </Section>

        <Section
          id="contato"
          title={t("sectionContact")}
          open={open.contato}
          onToggle={() => setOpen((s) => ({ ...s, contato: !s.contato }))}
        >
          <label className="flex flex-col gap-1 text-[13px]">
            {t("whatsapp")}
            <input
              value={whatsapp}
              onChange={(event) => {
                setWhatsapp(maskWhatsappInput(event.target.value));
                markDirty();
              }}
              placeholder="+55 (11) 99999-9999"
              className="ui-input"
              inputMode="tel"
              autoComplete="tel"
            />
          </label>
          <label className="flex flex-col gap-1 text-[13px]">
            {t("contactEmailLabel")}
            <input
              name="contactEmail"
              type="email"
              value={contactEmail}
              onChange={(event) => {
                setContactEmail(event.target.value);
                markDirty();
              }}
              className="ui-input"
            />
          </label>
        </Section>

        <Section
          id="privacidade"
          title={t("sectionPrivacy")}
          open={open.privacidade}
          onToggle={() =>
            setOpen((s) => ({ ...s, privacidade: !s.privacidade }))
          }
        >
          <Switch
            label={t("showWhatsapp")}
            description={t("showWhatsappHint")}
            checked={showWhatsapp}
            onChange={(checked) => {
              setShowWhatsapp(checked);
              markDirty();
            }}
          />
          <Switch
            label={t("showEmail")}
            description={t("showEmailHint")}
            checked={showEmail}
            onChange={(checked) => {
              setShowEmail(checked);
              markDirty();
            }}
          />
          <Switch
            label={t("competitorToggle")}
            description={t("competitorToggleHint")}
            checked={competitor}
            onChange={(checked) => {
              setCompetitor(checked);
              markDirty();
            }}
          />
          {competitor ? (
            <input type="hidden" name="competitor" value="on" />
          ) : null}
        </Section>

        {state.error ? (
          <p className="text-[13px] text-[var(--brand)]">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-[13px] text-green-700">{state.success}</p>
        ) : null}

        <StickyActionBar>
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-[12px] text-[var(--mute)]">
              {dirty ? t("unsavedChanges") : t("allSaved")}
            </span>
            <button
              type="submit"
              disabled={
                pending || slugStatus === "taken" || slugStatus === "invalid"
              }
              className="ui-btn ui-btn-primary disabled:opacity-60"
            >
              {pending ? t("saving") : t("saveProfile")}
            </button>
          </div>
        </StickyActionBar>
      </form>
    </div>
  );
}

function Section({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section id={`section-${id}`} className="ui-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between px-3.5 py-2 text-left"
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold">{title}</span>
        <span className="text-[var(--mute)]" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="flex flex-col gap-3 border-t border-[var(--line)] px-3.5 py-3">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function BeltSwatch({
  value,
  label,
  color,
  selected,
  onSelect,
}: {
  value: string;
  label: string;
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-[12px] font-semibold ${
        selected
          ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/30"
          : "border-[var(--line)]"
      }`}
    >
      <span
        className="h-4 w-8 rounded-sm border border-black/10"
        style={{ background: color }}
        aria-hidden
      />
      {label}
      <span className="sr-only">{value}</span>
    </button>
  );
}

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 512;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}
