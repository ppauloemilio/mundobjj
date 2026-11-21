"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  registerAcademyAction,
  registerAthleteAction,
  registerProfessorAction,
  type AuthFormState,
} from "@/app/actions/auth";
import { AcademySelect } from "@/components/academy-select";
import { LocationFields } from "@/components/location-fields";
import { useLocale } from "@/components/locale-provider";
import { ProfessorSelect } from "@/components/professor-select";
import { useAuthRedirect } from "@/lib/use-auth-redirect";

const initial: AuthFormState = {};

export function AthleteRegisterForm() {
  const { t } = useLocale();
  const [state, action, pending] = useActionState(registerAthleteAction, initial);
  const [academyId, setAcademyId] = useState("");
  useAuthRedirect(state.redirectTo);

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Field label={t("name")} name="name" required />
      <Field label={t("loginEmail")} name="email" type="email" required />
      <Field label={t("password")} name="password" type="password" required />
      <LocationFields />
      <AcademySelect onAcademyIdChange={setAcademyId} />
      <ProfessorSelect academyId={academyId} />
      {state.error ? <p className="text-[13px] text-[var(--accent)]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="ui-btn ui-btn-primary w-fit disabled:opacity-60"
      >
        {pending ? t("creating") : t("createAthlete")}
      </button>
      <p className="text-[13px] text-[var(--muted)]">
        {t("registerHasAccount")}{" "}
        <Link href="/entrar" className="underline">
          {t("navEnter")}
        </Link>
      </p>
    </form>
  );
}

export function AcademyRegisterForm() {
  const { t } = useLocale();
  const [state, action, pending] = useActionState(registerAcademyAction, initial);
  useAuthRedirect(state.redirectTo);

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Field label={t("academyName")} name="academyName" required />
      <Field label={t("accessEmail")} name="email" type="email" required />
      <Field label={t("password")} name="password" type="password" required />
      <Field label={t("academyWhatsapp")} name="whatsapp" />
      <p className="text-[13px] text-[var(--muted)]">{t("academyRegisterHint")}</p>
      {state.error ? <p className="text-[13px] text-[var(--accent)]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="ui-btn ui-btn-primary w-fit disabled:opacity-60"
      >
        {pending ? t("creating") : t("createAcademy")}
      </button>
      <p className="text-[13px] text-[var(--muted)]">
        {t("registerHasAccount")}{" "}
        <Link href="/entrar" className="underline">
          {t("navEnter")}
        </Link>
      </p>
    </form>
  );
}

export function ProfessorRegisterForm() {
  const { t } = useLocale();
  const [state, action, pending] = useActionState(registerProfessorAction, initial);
  useAuthRedirect(state.redirectTo);

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Field label={t("name")} name="name" required />
      <Field label={t("loginEmail")} name="email" type="email" required />
      <Field label={t("password")} name="password" type="password" required />
      <LocationFields />
      <p className="text-[13px] text-[var(--muted)]">{t("professorRegisterHint")}</p>
      {state.error ? <p className="text-[13px] text-[var(--accent)]">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="ui-btn ui-btn-primary w-fit disabled:opacity-60"
      >
        {pending ? t("creating") : t("createProfessor")}
      </button>
      <p className="text-[13px] text-[var(--muted)]">
        {t("registerHasAccount")}{" "}
        <Link href="/entrar" className="underline">
          {t("navEnter")}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      {label}
      <input name={name} type={type} required={required} className="ui-input" />
    </label>
  );
}
