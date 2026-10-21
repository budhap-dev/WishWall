import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { db } from "@/server/db";

/**
 * Local-development shortcut that signs in as a demo user without Google.
 *
 * Requires BOTH `next dev` (NODE_ENV=development; production builds always
 * run with NODE_ENV=production) AND DEV_LOGIN=true in .env, so it can't be
 * switched on in a deployment by accident.
 */
export function isDevLoginEnabled(): boolean {
  return env.NODE_ENV === "development" && env.DEV_LOGIN;
}

const DEMO_USER = { email: "demo@wishwall.local", name: "Demo User" };
const SESSION_DAYS = 30;

/** Creates a real Auth.js database session for the demo user and sets its cookie. */
export async function signInAsDemoUser(): Promise<void> {
  if (!isDevLoginEnabled()) throw new Error("Dev login is disabled");

  const user = await db.user.upsert({
    where: { email: DEMO_USER.email },
    update: {},
    create: DEMO_USER,
  });

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { sessionToken, userId: user.id, expires } });

  // Same cookie Auth.js sets after OAuth (non-"__Secure-" name: dev is http).
  (await cookies()).set("authjs.session-token", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
}
