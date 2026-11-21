"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import { formatDistance } from "@/lib/labels";
import type { AcademyResult } from "@/lib/search";

const beltLabel: Record<string, { pt: string; en: string }> = {
  white: { pt: "branca", en: "white" },
  blue: { pt: "azul", en: "blue" },
  purple: { pt: "roxa", en: "purple" },
  brown: { pt: "marrom", en: "brown" },
  black: { pt: "preta", en: "black" },
  gray: { pt: "cinza", en: "gray" },
  yellow: { pt: "amarela", en: "yellow" },
  orange: { pt: "laranja", en: "orange" },
  green: { pt: "verde", en: "green" },
};

export function AcademyResultCard({
  academy,
  selected,
  onSelect,
  profile,
}: {
  academy: AcademyResult;
  selected?: boolean;
  onSelect?: () => void;
  profile?: { belt?: string | null; cityName?: string | null } | null;
}) {
  const { locale, t } = useLocale();
  const distance = formatDistance(academy.distanceKm);
  const initials = academy.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const belt =
    beltLabel[profile?.belt ?? ""]?.[locale] ??
    profile?.belt ??
    (locale === "pt" ? "praticante" : "athlete");
  const city = profile?.cityName || academy.city || "";
  const message = t("whatsappVisitMessage", {
    belt,
    city: city || (locale === "pt" ? "minha cidade" : "my city"),
    date: locale === "pt" ? "estes dias" : "these days",
  });

  const wa = academy.whatsapp?.replace(/\D/g, "");
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <article
      id={`academy-card-${academy.id}`}
      className={`ui-card flex gap-3 p-3 transition ${
        selected ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/25" : ""
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 gap-3 text-left"
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[13px] font-bold text-[var(--brand)]"
          aria-hidden
        >
          {initials || "BJJ"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[14px] font-semibold tracking-tight">
              {academy.name}
            </h3>
            {distance ? (
              <span className="shrink-0 text-[12px] text-[var(--mute)]">
                {distance}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[12px] text-[var(--mute)]">
            {[academy.professorName, academy.neighborhood, academy.city]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {academy.nextClass ? (
            <p className="mt-1 text-[12px] font-medium text-[var(--ink)]">
              {academy.nextClass}
            </p>
          ) : null}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {academy.acceptsVisitor ? (
              <span className="rounded-md bg-[var(--brand-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                {t("acceptsVisitor")}
              </span>
            ) : null}
            {academy.dropInPrice ? (
              <span className="rounded-md border border-[var(--line)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--mute)]">
                {t("dropInPrice", { price: academy.dropInPrice })}
              </span>
            ) : null}
            {academy.verified ? (
              <span className="rounded-md bg-[var(--gold)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--gold)]">
                {t("verifiedBadge")}
              </span>
            ) : null}
          </div>
        </div>
      </button>
      <div className="flex shrink-0 flex-col gap-1.5">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="ui-btn ui-btn-primary inline-flex min-h-11 items-center justify-center px-3 text-[11px]"
          >
            {t("whatsappCta")}
          </a>
        ) : null}
        <Link
          href={`/academia/${academy.slug}`}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] px-3 text-[11px] font-semibold text-[var(--ink)]"
        >
          {t("viewAcademy")}
        </Link>
      </div>
    </article>
  );
}

export function AcademyCardSkeleton() {
  return (
    <div className="ui-card flex animate-pulse gap-3 p-3" aria-hidden>
      <div className="h-14 w-14 rounded-xl bg-[var(--line)]" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <div className="h-3 w-2/3 rounded bg-[var(--line)]" />
        <div className="h-3 w-1/2 rounded bg-[var(--line)]" />
        <div className="h-3 w-1/3 rounded bg-[var(--line)]" />
      </div>
    </div>
  );
}
