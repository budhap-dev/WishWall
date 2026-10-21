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

export type TestBoard = { id: string; shareSlug: string; revealSlug: string };

/** Inserts a board owned by `ownerId` (defaults: open, guests allowed, messages visible). */
export async function createTestBoard(
  ownerId: string,
  overrides: Partial<{
    title: string;
    status: "OPEN" | "CLOSED";
    allowGuests: boolean;
    messagesVisible: boolean;
  }> = {},
): Promise<TestBoard> {
  const board = {
    id: `e2eb${randomBytes(10).toString("hex")}`,
    shareSlug: randomBytes(24).toString("base64url"),
    revealSlug: randomBytes(24).toString("base64url"),
  };
  await withDb((db) =>
    db.query(
      `INSERT INTO "Board" (id, "ownerId", "shareSlug", "revealSlug", "recipientName", occasion,
         title, "templateId", status, "allowGuests", "messagesVisible", "updatedAt")
       VALUES ($1, $2, $3, $4, 'Maya', 'BIRTHDAY', $5, 'birthday-confetti-pop', $6, $7, $8, now())`,
      [
        board.id,
        ownerId,
        board.shareSlug,
        board.revealSlug,
        overrides.title ?? "Happy Birthday, Maya!",
        overrides.status ?? "OPEN",
        overrides.allowGuests ?? true,
        overrides.messagesVisible ?? true,
      ],
    ),
  );
  return board;
}

/** Inserts messages straight into the database (fast setup for read-only views). */
export async function insertMessages(
  boardId: string,
  messages: { author: string; body: string; hidden?: boolean }[],
): Promise<void> {
  if (messages.length === 0) return;
  // One multi-row INSERT; createdAt is staggered to keep a stable order.
  const values: unknown[] = [];
  const rows = messages.map((m, i) => {
    values.push(
      `e2em${randomBytes(10).toString("hex")}`,
      boardId,
      m.author,
      m.body,
      m.hidden ?? false,
      i,
    );
    const p = i * 6;
    return `($${p + 1}, $${p + 2}, $${p + 3}, $${p + 4}, 'c1', $${p + 5}, now() + ($${p + 6} * interval '1 millisecond'), now())`;
  });
  await withDb((db) =>
    db.query(
      `INSERT INTO "Message" (id, "boardId", "authorName", body, "cardColor", hidden, "createdAt", "updatedAt")
       VALUES ${rows.join(", ")}`,
      values,
    ),
  );
}
