"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type AuthFormState } from "@/app/actions/auth";
import { useLocale } from "@/components/locale-provider";
import { useAuthRedirect } from "@/lib/use-auth-redirect";

const initial: AuthFormState = {};

export function LoginForm() {
  const { t } = useLocale();
  const [state, action, pending] = useActionState(loginAction, initial);
  useAuthRedirect(state.redirectTo);

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Field
        label={t("loginEmail")}
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Field
        label={t("loginPassword")}
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {state.error ? (
        <p className="text-[13px] text-[var(--accent)]">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending || Boolean(state.redirectTo)}
        className="ui-btn ui-btn-primary w-fit disabled:opacity-60"
      >
        {pending || state.redirectTo ? t("loginLoading") : t("loginSubmit")}
      </button>
      <p className="text-[13px] text-[var(--muted)]">
        {t("loginNoAccount")}{" "}
        <Link href="/cadastro" className="font-medium text-[var(--ink)] underline">
          {t("loginSignUp")}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="ui-input"
      />
    </label>
  );
}
