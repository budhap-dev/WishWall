import { withDb } from "./fixtures";

/**
 * Playwright global setup/teardown. Tests post many messages from localhost,
 * which would leave the shared development database's per-IP counters maxed
 * out and block normal local use for an hour. Clear them before and after.
 */
export default async function resetRateLimits() {
  await withDb((db) => db.query(`DELETE FROM "RateLimit"`));
}
