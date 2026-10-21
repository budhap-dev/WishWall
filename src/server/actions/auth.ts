"use server";

import { redirect } from "next/navigation";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { signIn, signOut } from "@/server/auth";
import { isDevLoginEnabled, signInAsDemoUser } from "@/server/dev-login";

export async function signInWithGoogleAction(formData: FormData) {
  await signIn("google", {
    redirectTo: safeRedirectPath(formData.get("callbackUrl")),
  });
}

/** Dev-only: see src/server/dev-login.ts. */
export async function signInAsDemoUserAction(formData: FormData) {
  if (!isDevLoginEnabled()) redirect("/signin");
  await signInAsDemoUser();
  redirect(safeRedirectPath(formData.get("callbackUrl")));
}

/** Signs out, then goes to `redirectTo` (same-site paths only) or home. */
export async function signOutAction(redirectTo?: string) {
  await signOut({ redirectTo: safeRedirectPath(redirectTo, "/") });
}
