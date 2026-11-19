export const classKindLabel: Record<string, string> = {
  fundamentals: "Fundamentos",
  gi: "Kimono",
  nogi: "No-gi",
  competition: "Competição",
  kids: "Kids",
  open_mat: "Open mat",
};

const weekdays = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
] as const;

export function nextClassLabel(
  schedules: { weekday: number; startsAt: string; kind: string }[],
  now = new Date(),
) {
  if (schedules.length === 0) return null;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekdayName = parts.find((part) => part.type === "weekday")?.value;
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekdayName ?? "Sun",
  );
  const nowMinutes = ((weekdayIndex < 0 ? 0 : weekdayIndex) * 24 + hour) * 60 + minute;

  const ranked = schedules
    .map((schedule) => {
      const [startHour, startMinute] = schedule.startsAt.split(":").map(Number);
      const classMinutes =
        schedule.weekday * 24 * 60 + startHour * 60 + (startMinute || 0);
      const delta = (classMinutes - nowMinutes + 7 * 24 * 60) % (7 * 24 * 60);
      return { schedule, delta };
    })
    .sort((a, b) => a.delta - b.delta);

  const next = ranked[0]?.schedule;
  if (!next) return null;

  const day =
    next.weekday === (weekdayIndex < 0 ? 0 : weekdayIndex)
      ? "Hoje"
      : weekdays[next.weekday] ?? "dia";
  const time = next.startsAt.slice(0, 5);
  const kind = classKindLabel[next.kind] ?? next.kind;
  return `${day} · ${time} · ${kind}`;
}

export function formatDistance(km: number | null) {
  if (km == null || Number.isNaN(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}
