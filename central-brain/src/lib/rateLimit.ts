type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitState>();

export function getRequestIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "unknown";
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, retryAfter: Math.ceil(windowMs / 1000) };
  }

  if (existing.count >= limit) {
    const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return { ok: false, remaining: 0, retryAfter };
  }

  existing.count += 1;
  store.set(key, existing);
  return { ok: true, remaining: limit - existing.count, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
}
