"use client";

import { useState, useTransition } from "react";
import { verifyCompetitionAction } from "@/app/actions/competitions";
import { useLocale } from "@/components/locale-provider";

export function VerifyCompetitionButton({
  competitionId,
}: {
  competitionId: string;
}) {
  const { t } = useLocale();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <span className="text-[12px] font-semibold text-green-700 dark:text-green-300">
        {t("compVerified")}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        className="ui-btn border border-[var(--line)] text-[12px] disabled:opacity-60"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await verifyCompetitionAction(competitionId);
            if (result.error) {
              setError(result.error);
              return;
            }
            setDone(true);
          });
        }}
      >
        {pending ? t("saving") : t("compConfirm")}
      </button>
      {error ? (
        <p className="text-[12px] text-[var(--brand)]">{error}</p>
      ) : null}
    </div>
  );
}
