"use client";

import { useLocale } from "@/components/locale-provider";

type Counts = {
  gold: number;
  silver: number;
  bronze: number;
  medals: number;
  championships: number;
};

/** Silver · Gold · Bronze columns with proportional bars (prototype layout). */
export function MedalPodium({
  counts,
  showTotals = true,
}: {
  counts: Counts;
  showTotals?: boolean;
}) {
  const { t } = useLocale();
  const max = Math.max(counts.gold, counts.silver, counts.bronze, 1);
  const columns = [
    {
      key: "silver",
      count: counts.silver,
      label: t("medalSilver"),
      color: "var(--silver)",
    },
    {
      key: "gold",
      count: counts.gold,
      label: t("medalGold"),
      color: "var(--gold)",
    },
    {
      key: "bronze",
      count: counts.bronze,
      label: t("medalBronze"),
      color: "var(--bronze)",
    },
  ] as const;

  return (
    <div className="ui-card p-4">
      <div className="grid grid-cols-3 items-end gap-3">
        {columns.map((col) => {
          const heightPct = Math.max(12, Math.round((col.count / max) * 100));
          return (
            <div key={col.key} className="flex flex-col items-center gap-1.5">
              <span className="text-[15px] font-bold tabular-nums text-[var(--ink)]">
                {col.count}
              </span>
              <div
                className="w-full max-w-[72px] rounded-t-lg transition-[height] duration-300"
                style={{
                  height: `${heightPct}px`,
                  minHeight: "12px",
                  background: col.color,
                }}
                aria-hidden
              />
              <span className="text-center text-[11px] font-semibold text-[var(--mute)]">
                {col.label}
              </span>
            </div>
          );
        })}
      </div>
      {showTotals ? (
        <p className="mt-3 text-center text-[12px] text-[var(--mute)]">
          {t("medalTotals", {
            championships: counts.championships,
            medals: counts.medals,
          })}
        </p>
      ) : null}
    </div>
  );
}
