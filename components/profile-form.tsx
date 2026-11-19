"use client";

import { useActionState, useState } from "react";
import {
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
  showWhatsapp: boolean;
  showEmail: boolean;
};

export function ProfileForm({
  profile,
  hideAcademyFields = false,
}: {
  profile: ProfileValues;
  hideAcademyFields?: boolean;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initial);
  const [academyId, setAcademyId] = useState(profile.academyId ?? "");

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nome" name="name" defaultValue={profile.name} required />
      <Field label="Link do perfil" name="slug" defaultValue={profile.slug} required />
      <LocationFields initialCityId={profile.cityId ?? ""} />
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
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          Faixa
          <select
            name="belt"
            defaultValue={profile.belt}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          >
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
        <label className="flex flex-col gap-1 text-sm">
          Modalidade
          <select
            name="style"
            defaultValue={profile.style}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          >
            <option value="both">Kimono e no-gi</option>
            <option value="gi">Kimono</option>
            <option value="nogi">No-gi</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
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
      <label className="flex flex-col gap-1 text-sm">
        Bio
        <textarea
          name="bio"
          defaultValue={profile.bio ?? ""}
          rows={3}
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2"
        />
      </label>
      <Field label="WhatsApp" name="whatsapp" defaultValue={profile.whatsapp ?? ""} />
      <Field
        label="E-mail de contato"
        name="contactEmail"
        type="email"
        defaultValue={profile.contactEmail ?? ""}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="competitor" defaultChecked={profile.competitor} />
        Competidor
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="showWhatsapp"
          defaultChecked={profile.showWhatsapp}
        />
        Mostrar WhatsApp no perfil público
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="showEmail" defaultChecked={profile.showEmail} />
        Mostrar e-mail no perfil público
      </label>
      {state.error ? <p className="text-sm text-[var(--accent)]">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-green-700">{state.success}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full bg-[var(--accent)] px-5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar perfil"}
      </button>
    </form>
  );
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
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={min}
        max={max}
        className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
      />
    </label>
  );
}
