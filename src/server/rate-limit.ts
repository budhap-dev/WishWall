import "server-only";
import { db } from "@/server/db";

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: Date };

/**
 * Fixed-window counter in Postgres: one atomic upsert per check, so it works
 * across serverless instances without Redis. When the window has expired the
 * counter restarts at 1.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" (key, count, "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit".count + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= now()
        THEN now() + make_interval(secs => ${windowSeconds})
        ELSE "RateLimit"."resetAt" END
    RETURNING count, "resetAt"`;
  const row = rows[0]!;

  // Occasionally sweep expired rows so the table stays small.
  if (Math.random() < 0.01) {
    void db.rateLimit
      .deleteMany({ where: { resetAt: { lt: new Date() } } })
      .catch(() => {});
  }

  return {
    ok: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    resetAt: row.resetAt,
  };
}

export function retryAfterText(resetAt: Date): string {
  const minutes = Math.max(
    1,
    Math.ceil((resetAt.getTime() - Date.now()) / 60_000),
  );
  return minutes === 1 ? "a minute" : `${minutes} minutes`;
}
