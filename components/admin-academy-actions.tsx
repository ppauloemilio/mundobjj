"use client";

import { useActionState, useEffect } from "react";
import {
  createAcademyOwnerAccessAction,
  type AccessFormState,
} from "@/app/actions/academy-access";
import {
  toggleAcademyBlockAction,
  updateAcademyAdminAction,
  type AdminFormState,
} from "@/app/actions/admin";
import { AddressFields } from "@/components/address-fields";
import { ResponsibleProfessorSelect } from "@/components/responsible-professor-select";

const initial: AdminFormState = {};
const accessInitial: AccessFormState = {};

type AcademyRow = {
  id: string;
  name: string;
  slug: string;
  professorName: string | null;
  whatsapp: string | null;
  address: string | null;
  postalCode: string | null;
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
  neighborhood: string | null;
  countryIso2?: string | null;
  stateCode?: string | null;
  cityName?: string | null;
  acceptsVisitor: boolean;
  blockedAt: Date | null;
  ownerId: string | null;
};

export function AdminAcademyCard({ academy }: { academy: AcademyRow }) {
  const [state, action, pending] = useActionState(
    updateAcademyAdminAction,
    initial,
  );
  const [accessState, accessAction, accessPending] = useActionState(
    createAcademyOwnerAccessAction,
    accessInitial,
  );

  useEffect(() => {
    if (accessState.whatsappUrl) {
      window.open(accessState.whatsappUrl, "_blank", "noopener,noreferrer");
    }
  }, [accessState.whatsappUrl, accessState.temporaryPassword]);

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="academyId" value={academy.id} />
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Nome
          <input
            name="name"
            defaultValue={academy.name}
            required
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <div className="sm:col-span-2">
          <ResponsibleProfessorSelect
            initialProfessorName={academy.professorName ?? ""}
          />
        </div>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          WhatsApp
          <input
            name="whatsapp"
            defaultValue={academy.whatsapp ?? ""}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <div className="sm:col-span-2">
          <AddressFields
            initial={{
              countryIso2: academy.countryIso2,
              stateCode: academy.stateCode,
              cityName: academy.cityName,
              postalCode: academy.postalCode,
              street: academy.street,
              streetNumber: academy.streetNumber,
              complement: academy.complement,
              neighborhood: academy.neighborhood,
            }}
          />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="acceptsVisitor"
            defaultChecked={academy.acceptsVisitor}
          />
          Aceita visitante
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </form>

      {state.error ? (
        <p className="mt-2 text-sm text-[var(--accent)]">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-2 text-sm text-green-700">{state.success}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a href={`/academia/${academy.slug}`} className="text-sm underline">
          Ver página pública
        </a>
        <form action={toggleAcademyBlockAction}>
          <input type="hidden" name="academyId" value={academy.id} />
          <input
            type="hidden"
            name="block"
            value={academy.blockedAt ? "0" : "1"}
          />
          <button
            type="submit"
            className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm"
          >
            {academy.blockedAt ? "Desbloquear" : "Bloquear na busca"}
          </button>
        </form>
      </div>
      {academy.blockedAt ? (
        <p className="mt-2 text-sm text-[var(--accent)]">Bloqueada na busca</p>
      ) : null}

      {!academy.ownerId ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-[var(--line)] p-3">
          <p className="text-sm font-medium">
            Sem dono — liberar acesso ao responsável
          </p>
          <form action={accessAction} className="grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="academyId" value={academy.id} />
            <input type="hidden" name="mode" value="manual" />
            <label className="flex flex-col gap-1 text-sm">
              Nome
              <input
                name="name"
                required
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              E-mail
              <input
                name="email"
                type="email"
                required
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              WhatsApp
              <input
                name="whatsapp"
                defaultValue={academy.whatsapp ?? ""}
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Senha
              <input
                name="password"
                minLength={6}
                required
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              />
            </label>
            <button
              type="submit"
              disabled={accessPending}
              className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm sm:col-span-2 disabled:opacity-60"
            >
              {accessPending ? "..." : "Criar acesso com esta senha"}
            </button>
          </form>
          <p className="text-xs text-[var(--muted)]">
            Ou aguarde a solicitação na ficha pública e aprove com senha
            aleatória + WhatsApp na seção acima.
          </p>
          {accessState.error ? (
            <p className="text-sm text-[var(--accent)]">{accessState.error}</p>
          ) : null}
          {accessState.temporaryPassword ? (
            <div className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm">
              {accessState.success ? <p>{accessState.success}</p> : null}
              <p>
                Senha: <strong>{accessState.temporaryPassword}</strong>
              </p>
              {accessState.whatsappUrl ? (
                <a
                  href={accessState.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Abrir WhatsApp
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-green-700">Já tem responsável com acesso.</p>
      )}
    </article>
  );
}