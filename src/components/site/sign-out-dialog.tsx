"use client";

import { ConfirmDialog } from "@/components/dashboard/confirm-button";
import { signOutAction } from "@/server/actions/auth";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where to land after signing out (default: the home page). */
  redirectTo?: string;
};

/** Confirms before signing out, so a stray tap on a phone doesn't. */
export function SignOutDialog({ open, onOpenChange, redirectTo }: Props) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      destructive
      title="Sign out?"
      description="You'll need to sign in with Google again to manage your boards."
      confirmLabel="Sign out"
      onConfirm={() => signOutAction(redirectTo)}
    />
  );
}
