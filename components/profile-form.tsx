"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  completeOnboardingAction,
  updateProfileAction,
  type ProfileFormState,
} from "@/app/actions/profile";
import { AcademySelect } from "@/components/academy-select";
import { LocationFields } from "@/components/location-fields";
import { ProfessorSelect } from "@/components/professor-select";

const initial: ProfileFormState = {};

const belts = [
  ["white", "Branca"],
  ["blue", "Azul"],
  ["purple", "Roxa"],
  ["brown", "Marrom"],
  ["black", "Preta"],
  ["gray", "Cinza"],
  ["yellow", "Amarela"],
  ["orange", "Laranja"],
  ["green", "Verde"],
] as const;

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
  startedAt: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
  accountEmail?: string | null;
  showWhatsapp: boolean;
  showEmail: boolean;
};

export function ProfileForm({
  profile,
  hideAcademyFields = false,
  showHomeCta = false,
}: {
  profile: ProfileValues;
  hideAcademyFields?: boolean;
  showHomeCta?: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const [academyId, setAcademyId] = useState(profile.academyId ?? "");
  const [slug, setSlug] = useState(profile.slug);
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");
  const [formKey, setFormKey] = useState(0);

  const contactEmail =
    profile.contactEmail?.trim() || profile.accountEmail?.trim() || "";

  useEffect(() => {
    setSlug(profile.slug);
  }, [profile.slug]);

  useEffect(() => {
    if (state.success && state.savedAt) {
      setFormKey((value) => value + 1);
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

  return (
    <div className="flex flex-col gap-4">
      {showHomeCta ? (
        <div className="ui-card flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-[var(--muted)]">
            Complete seu perfil e depois vá para a busca de academias.
          </p>
          <form
            action={async () => {
              await completeOnboardingAction();
              router.push("/");
            }}
          >
            <button type="submit" className="ui-btn ui-btn-primary">
              Ir para a busca
            </button>
          </form>
        </div>
      ) : (
        <div className="flex justify-end">
          <Link href="/" className="text-[13px] font-medium underline">
            Ir para a busca
          </Link>
        </div>
      )}

      <form
        key={`${profile.slug}-${formKey}-${state.savedAt ?? "init"}`}
        action={action}
        className="flex flex-col gap-3.5"
      >
        <Field label="Nome" name="name" defaultValue={profile.name} required />
        <label className="flex flex-col gap-1 text-[13px]">
          Link do perfil
          <input
            name="slug"
            value={slug}
            required
            onChange={(event) => setSlug(event.target.value)}
            className="ui-input"
          />
          <span className="text-[11px] text-[var(--muted)]">
            /atleta/{slugifyPreview(slug) || "…"}
          </span>
          {slugStatus === "checking" ? (
            <span className="text-[11px] text-[var(--muted)]">
              Verificando disponibilidade…
            </span>
          ) : null}
          {slugStatus === "available" ? (
            <span className="text-[11px] text-green-700">Link disponível.</span>
          ) : null}
          {slugStatus === "taken" ? (
            <span className="text-[11px] text-[var(--accent)]">
              Este link já está em uso.
            </span>
          ) : null}
          {slugStatus === "invalid" ? (
            <span className="text-[11px] text-[var(--accent)]">
              Use letras, números ou hífen.
            </span>
          ) : null}
        </label>
        <LocationFields
          key={`${profile.countryIso2}-${profile.stateCode}-${profile.cityName}-${formKey}`}
          initialCountryIso2={profile.countryIso2 ?? ""}
          initialStateCode={profile.stateCode ?? ""}
          initialCityName={profile.cityName ?? ""}
        />
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
        <div className="grid gap-2.5 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-[13px]">
            Faixa
            <select name="belt" defaultValue={profile.belt} className="ui-input">
              {belts.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Graus"
            name="stripes"
            type="number"
            defaultValue={String(profile.stripes)}
            min="0"
            max="4"
          />
          <label className="flex flex-col gap-1 text-[13px]">
            Modalidade
            <select
              name="style"
              defaultValue={profile.style}
              className="ui-input"
            >
              <option value="both">Kimono e no-gi</option>
              <option value="gi">Kimono</option>
              <option value="nogi">No-gi</option>
            </select>
          </label>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Field
            label="Peso (kg)"
            name="weightKg"
            defaultValue={profile.weightKg ?? ""}
          />
          <Field
            label="Treina desde"
            name="startedAt"
            type="date"
            defaultValue={profile.startedAt ?? ""}
          />
        </div>
        <label className="flex flex-col gap-1 text-[13px]">
          Bio
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            rows={3}
            className="ui-input min-h-[5rem] py-2"
          />
        </label>
        <Field
          label="WhatsApp"
          name="whatsapp"
          defaultValue={profile.whatsapp ?? ""}
        />
        <Field
          label="E-mail de contato"
          name="contactEmail"
          type="email"
          defaultValue={contactEmail}
        />
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            name="competitor"
            defaultChecked={profile.competitor}
          />
          Competidor
        </label>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            name="showWhatsapp"
            defaultChecked={profile.showWhatsapp}
          />
          Mostrar WhatsApp no perfil público
        </label>
        <label className="flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            name="showEmail"
            defaultChecked={profile.showEmail}
          />
          Mostrar e-mail no perfil público
        </label>
        {state.error ? (
          <p className="text-[13px] text-[var(--accent)]">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-[13px] text-green-700">{state.success}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending || slugStatus === "taken" || slugStatus === "invalid"}
          className="ui-btn ui-btn-primary w-fit disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar perfil"}
        </button>
      </form>
    </div>
  );
}

function slugifyPreview(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  min?: string;
  max?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px]">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={min}
        max={max}
        className="ui-input"
      />
    </label>
  );
}
