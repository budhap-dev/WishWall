"use server";

import { safeRedirectPath } from "@/lib/safe-redirect";
import { signIn, signOut } from "@/server/auth";

export async function signInWithGoogleAction(formData: FormData) {
  await signIn("google", {
    redirectTo: safeRedirectPath(formData.get("callbackUrl")),
  });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
