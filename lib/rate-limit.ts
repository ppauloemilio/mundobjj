import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number; message: string };

function prune(now: number) {
  if (buckets.size < 2_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/** Fixed-window limiter (in-memory; resets on cold start — still stops bursts). */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      ok: false,
      retryAfterSec,
      message: `Muitas tentativas. Aguarde ${retryAfterSec}s e tente de novo.`,
    };
  }
  bucket.count += 1;
  return { ok: true };
}

export function clearRateLimit(key: string) {
  buckets.delete(key);
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return (h.get("x-real-ip") || h.get("cf-connecting-ip") || "unknown").slice(
    0,
    64,
  );
}

/** Login: 5 attempts / 15 min per IP+email, 20 / 15 min per IP. */
export async function limitLoginAttempt(email: string): Promise<RateLimitResult> {
  const ip = await clientIp();
  const normalized = email.trim().toLowerCase();
  const perAccount = rateLimit(`login:${ip}:${normalized}`, 5, 15 * 60_000);
  if (!perAccount.ok) return perAccount;
  return rateLimit(`login-ip:${ip}`, 20, 15 * 60_000);
}

/** Register: 3 / hour per IP. */
export async function limitRegisterAttempt(): Promise<RateLimitResult> {
  const ip = await clientIp();
  return rateLimit(`register:${ip}`, 3, 60 * 60_000);
}

/** Public API: 60 / min per IP. */
export async function limitPublicApi(route: string): Promise<RateLimitResult> {
  const ip = await clientIp();
  return rateLimit(`api:${route}:${ip}`, 60, 60_000);
}

/** Auth callback / authorize: share login buckets. */
export function limitAuthorize(email: string, ip: string): RateLimitResult {
  const normalized = email.trim().toLowerCase();
  const perAccount = rateLimit(`login:${ip}:${normalized}`, 5, 15 * 60_000);
  if (!perAccount.ok) return perAccount;
  return rateLimit(`login-ip:${ip}`, 20, 15 * 60_000);
}

export function markLoginSuccess(email: string, ip: string) {
  const normalized = email.trim().toLowerCase();
  clearRateLimit(`login:${ip}:${normalized}`);
}
