"use client";

import { useActionState } from "react";
import {
  deleteAccountAction,
  type DeleteAccountState,
} from "@/app/actions/profile";
import { ChangePasswordForm } from "@/components/change-password-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocale } from "@/components/locale-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const deleteInitial: DeleteAccountState = {};

export function SettingsClient() {
  const { t } = useLocale();
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteAccountAction,
    deleteInitial,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="ui-card flex flex-col gap-3 p-4">
        <h2 className="text-[15px] font-semibold">{t("settingsLanguage")}</h2>
        <LanguageSwitcher />
      </div>

      <div className="ui-card flex flex-col gap-3 p-4">
        <h2 className="text-[15px] font-semibold">{t("settingsTheme")}</h2>
        <ThemeToggle />
      </div>

      <ChangePasswordForm />

      <form action={deleteAction} className="ui-card flex flex-col gap-3 p-4">
        <h2 className="text-[15px] font-semibold text-[var(--brand)]">
          {t("deleteAccount")}
        </h2>
        <p className="text-[13px] text-[var(--mute)]">{t("deleteAccountHint")}</p>
        <label className="flex flex-col gap-1 text-[13px]">
          {t("deleteConfirmLabel")}
          <input name="confirm" className="ui-input" autoComplete="off" />
        </label>
        {deleteState.error ? (
          <p className="text-[13px] text-[var(--brand)]">{deleteState.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={deleting}
          className="ui-btn min-h-11 border border-[var(--brand)] text-[var(--brand)] disabled:opacity-60"
        >
          {deleting ? t("deleting") : t("deleteAccount")}
        </button>
      </form>
    </div>
  );
}
