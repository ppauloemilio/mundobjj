export type ModerationStatus = "active" | "suspended" | "blocked";

export function moderationStatus(row: {
  blockedAt?: Date | string | null;
  suspendedAt?: Date | string | null;
}): ModerationStatus {
  if (row.blockedAt) return "blocked";
  if (row.suspendedAt) return "suspended";
  return "active";
}

export function moderationPatch(status: ModerationStatus) {
  if (status === "blocked") {
    return { blockedAt: new Date(), suspendedAt: null as Date | null };
  }
  if (status === "suspended") {
    return { blockedAt: null as Date | null, suspendedAt: new Date() };
  }
  return { blockedAt: null as Date | null, suspendedAt: null as Date | null };
}

/** Hidden from public search / listings. */
export function isPubliclyRestricted(row: {
  blockedAt?: Date | string | null;
  suspendedAt?: Date | string | null;
}) {
  return Boolean(row.blockedAt || row.suspendedAt);
}

/** Login denied for user accounts. */
export function isLoginRestricted(row: {
  blockedAt?: Date | string | null;
  suspendedAt?: Date | string | null;
}) {
  return Boolean(row.blockedAt || row.suspendedAt);
}

export function moderationLabel(status: ModerationStatus) {
  if (status === "blocked") return "Bloqueado";
  if (status === "suspended") return "Suspenso";
  return "Ativo";
}
