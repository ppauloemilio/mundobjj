"use client";

import { useActionState } from "react";
import {
  resetUserPasswordAction,
  toggleUserBlockAction,
  updateUserAction,
  type AdminFormState,
} from "@/app/actions/admin";

const initial: AdminFormState = {};

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  blockedAt: Date | null;
};

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
  const [resetState, resetAction, resetPending] = useActionState(
    resetUserPasswordAction,
    initial,
  );

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
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
            <option value="user">Usuário</option>
            <option value="admin">Admin</option>
          </select>
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

      <div className="mt-4 flex flex-wrap gap-2">
        {user.id !== currentAdminId ? (
          <form action={toggleUserBlockAction}>
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="block" value={user.blockedAt ? "0" : "1"} />
            <button
              type="submit"
              className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm"
            >
              {user.blockedAt ? "Desbloquear" : "Bloquear"}
            </button>
          </form>
        ) : null}

        <form action={resetAction}>
          <input type="hidden" name="userId" value={user.id} />
          <button
            type="submit"
            disabled={resetPending}
            className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm disabled:opacity-60"
          >
            {resetPending ? "Resetando..." : "Resetar senha"}
          </button>
        </form>
      </div>

      {user.blockedAt ? (
        <p className="mt-2 text-sm text-[var(--accent)]">Usuário bloqueado</p>
      ) : null}
      {resetState.temporaryPassword ? (
        <p className="mt-2 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-sm">
          Senha temporária: <strong>{resetState.temporaryPassword}</strong>
        </p>
      ) : null}
      {resetState.error ? (
        <p className="mt-2 text-sm text-[var(--accent)]">{resetState.error}</p>
      ) : null}
    </article>
  );
}
