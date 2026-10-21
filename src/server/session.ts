import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { auth } from "@/server/auth";

/**
 * Data Access Layer for the signed-in user. Every page, Server Action and
 * Route Handler that needs the user goes through here; never trust a user id
 * sent by the client.
 *
 * Reading the session reads request cookies, so callers must render inside a
 * <Suspense> boundary (Cache Components requirement).
 */

export type CurrentUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

/** The signed-in user, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Auth.js generates random values while resolving a session, which Next
  // forbids during prerendering (including the per-session App Shell that
  // Partial Prefetching builds). connection() marks the read as request-time.
  await connection();
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return null;
  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    image: user.image ?? null,
  };
});

/** The signed-in user; otherwise redirects to sign-in and back to `returnTo`. */
export async function requireUser(
  returnTo = "/dashboard",
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  }
  return user;
}
