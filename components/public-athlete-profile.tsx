"use client";

import Link from "next/link";
import { BeltRankVisual } from "@/components/belt-rank-visual";
import { CompetitionsPanel } from "@/components/competitions-panel";
import { useLocale } from "@/components/locale-provider";
import { ageDivisionFromBirthDate } from "@/lib/age-category";
import {
  bestCompetition,
  type CompetitionRow,
} from "@/lib/competitions";
import {
  adultBeltColors,
  kidBeltColors,
  matsTimeLabel,
  weightCategoryLabel,
} from "@/lib/profile-display";

type Props = {
  profile: {
    name: string;
    slug: string;
    belt: string;
    stripes: number;
    bio: string | null;
    avatarUrl: string | null;
    weightCategory: string | null;
    birthDate?: string | null;
    startedAt: string | null;
    whatsapp: string | null;
    contactEmail: string | null;
    showWhatsapp: boolean;
    showEmail: boolean;
    competitor: boolean;
  };
  place: string;
  academy: { name: string; slug: string } | null;
  professorName: string | null;
  competitions?: CompetitionRow[];
};

export function PublicAthleteProfile({
  profile,
  place,
  academy,
  professorName,
  competitions = [],
}: Props) {
  const { locale, t } = useLocale();
  const beltColor =
    adultBeltColors[profile.belt] ||
    kidBeltColors[profile.belt] ||
    "#e4e3e8";
  const mats = matsTimeLabel(profile.startedAt, locale);
  const category = weightCategoryLabel(profile.weightCategory, locale);
  const highlight = bestCompetition(competitions);
  const ageDivision = ageDivisionFromBirthDate(profile.birthDate);
  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://mundobjj.vercel.app/atleta/${profile.slug}`;

  async function share() {
    const url =
      typeof window !== "undefined" ? window.location.href : shareUrl;
    try {
      if (navigator.share) {
        await navigator.share({
          title: profile.name,
          text: t("shareAthleteText", { name: profile.name }),
          url,
        });
        return;
      }
    } catch {
      /* fall through */
    }
    await navigator.clipboard.writeText(url);
    alert(t("linkCopied"));
  }

  const wa = profile.showWhatsapp
    ? profile.whatsapp?.replace(/\D/g, "")
    : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="h-24 w-24 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--brand-soft)]">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[var(--brand)]">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <BeltRankVisual
            belt={profile.belt}
            stripes={profile.stripes}
            size="md"
            label={t(`belt_${profile.belt}` as "belt_white")}
          />
          {ageDivision ? (
            <p className="max-w-[12rem] text-center text-[14px] leading-snug text-[var(--mute)]">
              <span className="text-[16px] font-semibold tracking-tight text-[var(--ink)]">
                {t(`ageDiv_${ageDivision.id}` as "ageDiv_ADULT")}
              </span>
              <br />
              {t("ageCategoryYears", { age: ageDivision.chronologicalAge })}
            </p>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[var(--mute)] uppercase">
            {t("athleteLabel")}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {profile.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-2.5 py-1 text-[12px] font-semibold"
              style={{ background: `${beltColor}22` }}
            >
              <span
                className="h-3 w-8 rounded-sm border border-black/10"
                style={{ background: beltColor }}
                aria-hidden
              />
              {t(`belt_${profile.belt}` as "belt_white")}
              <span className="text-[var(--mute)]">
                {"•".repeat(profile.stripes) || "·"}
              </span>
            </span>
            {place ? (
              <span className="text-[13px] text-[var(--mute)]">{place}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-2 text-[14px]">
        {academy ? (
          <p>
            {t("academyLabel")}:{" "}
            <Link
              href={`/academia/${academy.slug}`}
              className="font-medium underline"
            >
              {academy.name}
            </Link>
          </p>
        ) : null}
        {professorName ? (
          <p>
            {t("professorLabel")}: {professorName}
          </p>
        ) : null}
        {category ? (
          <p>
            {t("weightCategory")}: {category}
          </p>
        ) : null}
        {mats ? <p>{mats}</p> : null}
      </div>

      {profile.bio ? (
        <p className="leading-7 text-[15px] text-[var(--ink)]">{profile.bio}</p>
      ) : null}

      {profile.competitor && highlight ? (
        <div className="ui-card border-[var(--gold)]/40 p-3.5">
          <p className="text-[11px] font-semibold tracking-wide text-[var(--mute)] uppercase">
            {t("compHighlight")}
          </p>
          <p className="mt-1 text-[15px] font-semibold">{highlight.name}</p>
          <p className="text-[13px] text-[var(--mute)]">
            {t(`compResult_${highlight.result}` as "compResult_GOLD")}
            {highlight.isAbsolute ? ` · ${t("compAbsolute")}` : ""}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {wa ? (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            className="ui-btn ui-btn-primary"
          >
            WhatsApp
          </a>
        ) : null}
        {profile.showEmail && profile.contactEmail ? (
          <a
            href={`mailto:${profile.contactEmail}`}
            className="ui-btn border border-[var(--line)]"
          >
            {profile.contactEmail}
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => void share()}
          className="ui-btn border border-[var(--line)]"
        >
          {t("shareProfile")}
        </button>
        {highlight ? (
          <button
            type="button"
            onClick={() => void share()}
            className="ui-btn border border-[var(--line)]"
          >
            {t("shareAchievement")}
          </button>
        ) : null}
      </div>

      {profile.competitor ? (
        <CompetitionsPanel
          publicMode
          initial={competitions}
          profile={{
            belt: profile.belt,
            weightCategory: profile.weightCategory,
            name: profile.name,
            cityName: place || null,
          }}
        />
      ) : null}
    </main>
  );
}
