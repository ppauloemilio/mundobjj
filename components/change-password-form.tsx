"use client";

import { useActionState } from "react";
import {
  changeOwnPasswordAction,
  type PasswordFormState,
} from "@/app/actions/password";
import { useLocale } from "@/components/locale-provider";

const initial: PasswordFormState = {};

export function ChangePasswordForm() {
  const { t } = useLocale();
  const [state, action, pending] = useActionState(
    changeOwnPasswordAction,
    initial,
  );

  return (
    <form action={action} className="ui-card flex flex-col gap-3 p-4">
      <h2 className="text-[15px] font-semibold">{t("changePassword")}</h2>
      <label className="flex flex-col gap-1 text-[13px]">
        {t("currentPassword")}
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="ui-input"
        />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        {t("newPassword")}
        <input
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          className="ui-input"
        />
      </label>
      <label className="flex flex-col gap-1 text-[13px]">
        {t("confirmPassword")}
        <input
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="ui-input"
        />
      </label>
      {state.error ? (
        <p className="text-[13px] text-[var(--brand)]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-[13px] text-green-700">{state.success}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="ui-btn min-h-11 w-fit border border-[var(--line)] disabled:opacity-60"
      >
        {pending ? t("saving") : t("updatePassword")}
      </button>
    </form>
  );
}
