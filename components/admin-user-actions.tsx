"use client";

import { useActionState, useEffect } from "react";
import {
  resetUserPasswordWhatsAppAction,
  setUserModerationAction,
  setUserPasswordAction,
  updateUserAction,
  type AdminFormState,
} from "@/app/actions/admin";
import { AdminModerationButtons } from "@/components/admin-moderation-buttons";
import { moderationLabel, moderationStatus } from "@/lib/moderation";

const initial: AdminFormState = {};

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  accountType: "athlete" | "academy" | "professor" | "admin";
  blockedAt: Date | null;
  suspendedAt: Date | null;
  whatsapp: string | null;
};

const accountLabel = {
  athlete: "Praticante",
  academy: "Academia",
  professor: "Professor",
  admin: "Admin (gestão)",
} as const;

export function AdminUserCard({
  user,
  currentAdminId,
}: {
  user: UserRow;
  currentAdminId: string;
}) {
  const [editState, editAction, editPending] = useActionState(
    updateUserAction,
    initial,
  );
  const [setState, setAction, setPending] = useActionState(
    setUserPasswordAction,
    initial,
  );
  const [waState, waAction, waPending] = useActionState(
    resetUserPasswordWhatsAppAction,
    initial,
  );

  useEffect(() => {
    if (waState.whatsappUrl) {
      window.open(waState.whatsappUrl, "_blank", "noopener,noreferrer");
    }
  }, [waState.whatsappUrl, waState.temporaryPassword]);

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="mb-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
        <span className="rounded-full border border-[var(--line)] px-2 py-1">
          {accountLabel[user.accountType]}
        </span>
        <span className="rounded-full border border-[var(--line)] px-2 py-1">
          {moderationLabel(moderationStatus(user))}
        </span>
        {user.whatsapp ? (
          <span className="rounded-full border border-[var(--line)] px-2 py-1">
            WhatsApp {user.whatsapp}
          </span>
        ) : (
          <span className="rounded-full border border-[var(--line)] px-2 py-1 text-[var(--accent)]">
            Sem WhatsApp
          </span>
        )}
      </div>

      <form action={editAction} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="userId" value={user.id} />
        <label className="flex flex-col gap-1 text-sm">
          Nome
          <input
            name="name"
            defaultValue={user.name ?? ""}
            required
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            name="email"
            type="email"
            defaultValue={user.email ?? ""}
            required
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Papel
          <select
            name="role"
            defaultValue={user.role}
            className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
          >
            <option value="user">Usuário (atleta/academia/professor)</option>
            <option value="admin">Admin (só gestão do app)</option>
          </select>
          <span className="text-xs text-[var(--muted)]">
            Admin não usa painel de atleta — treino é outra conta.
          </span>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={editPending}
            className="min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {editPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>

      {editState.error ? (
        <p className="mt-2 text-sm text-[var(--accent)]">{editState.error}</p>
      ) : null}
      {editState.success ? (
        <p className="mt-2 text-sm text-green-700">{editState.success}</p>
      ) : null}

      <div className="mt-4 grid gap-3 rounded-xl border border-[var(--line)] p-3">
        <p className="text-sm font-medium">Reset de senha</p>
        <form action={setAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="userId" value={user.id} />
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Definir senha manualmente
            <input
              name="password"
              type="text"
              minLength={6}
              required
              placeholder="Nova senha"
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
            />
          </label>
          <button
            type="submit"
            disabled={setPending}
            className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm disabled:opacity-60"
          >
            {setPending ? "..." : "Definir e copiar"}
          </button>
        </form>
        {setState.temporaryPassword ? (
          <PasswordResult
            password={setState.temporaryPassword}
            message={setState.success}
            whatsappUrl={setState.whatsappUrl}
          />
        ) : null}
        {setState.error ? (
          <p className="text-sm text-[var(--accent)]">{setState.error}</p>
        ) : null}

        <form action={waAction}>
          <input type="hidden" name="userId" value={user.id} />
          <button
            type="submit"
            disabled={waPending}
            className="min-h-11 rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {waPending
              ? "Gerando..."
              : "Gerar senha aleatória e enviar no WhatsApp"}
          </button>
        </form>
        {waState.temporaryPassword ? (
          <PasswordResult
            password={waState.temporaryPassword}
            message={waState.success || waState.error}
            whatsappUrl={waState.whatsappUrl}
          />
        ) : null}
        {waState.error && !waState.temporaryPassword ? (
          <p className="text-sm text-[var(--accent)]">{waState.error}</p>
        ) : null}
      </div>

      {user.id !== currentAdminId ? (
        <div className="mt-4">
          <AdminModerationButtons
            entityId={user.id}
            idField="userId"
            blockedAt={user.blockedAt}
            suspendedAt={user.suspendedAt}
            action={setUserModerationAction}
          />
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted)]">
          Você não pode suspender ou bloquear a própria conta admin.
        </p>
      )}
    </article>
  );
}

function PasswordResult({
  password,
  message,
  whatsappUrl,
}: {
  password: string;
  message?: string;
  whatsappUrl?: string;
}) {
  return (
    <div className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm">
      {message ? <p className="mb-1">{message}</p> : null}
      <p>
        Senha: <strong>{password}</strong>
      </p>
      {whatsappUrl ? (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block underline"
        >
          Abrir WhatsApp novamente
        </a>
      ) : null}
    </div>
  );
}