import { randomBytes } from "node:crypto";
import { test as base, expect } from "@playwright/test";
import "dotenv/config";
import { Client } from "pg";

/**
 * `signedIn` gives a page that's logged in as a throwaway user, without going
 * through Google: it inserts a User + Session row (exactly what Auth.js's
 * database strategy does after OAuth) and sets the session cookie. The user
 * and everything it owns (cascade) are deleted afterwards.
 */

type TestUser = { id: string; name: string; email: string };

export async function withDb<T>(fn: (db: Client) => Promise<T>): Promise<T> {
  const db = new Client({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  });
  await db.connect();
  try {
    return await fn(db);
  } finally {
    await db.end();
  }
}

export const test = base.extend<{ user: TestUser }>({
  user: async ({ context, baseURL }, provide) => {
    const suffix = randomBytes(6).toString("hex");
    const user = {
      id: `e2e${suffix}`,
      name: "E2E Tester",
      email: `e2e-${suffix}@example.test`,
    };
    const sessionToken = randomBytes(32).toString("hex");

    await withDb(async (db) => {
      await db.query(
        `INSERT INTO "User" (id, name, email, "createdAt", "updatedAt") VALUES ($1, $2, $3, now(), now())`,
        [user.id, user.name, user.email],
      );
      await db.query(
        `INSERT INTO "Session" ("sessionToken", "userId", expires, "createdAt", "updatedAt")
         VALUES ($1, $2, now() + interval '1 day', now(), now())`,
        [sessionToken, user.id],
      );
    });

    await context.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        url: baseURL!,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await provide(user);

    await withDb((db) =>
      db.query(`DELETE FROM "User" WHERE id = $1`, [user.id]),
    );
  },
});

export { expect };
