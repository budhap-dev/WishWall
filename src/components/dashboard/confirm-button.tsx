"use client";

import type { ComponentProps, ReactNode } from "react";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  /** Resolve to close the dialog; the dialog stays open (with buttons re-enabled) if it throws. */
  onConfirm: () => Promise<void>;
};

/** Asks for confirmation before running an action; opened by its caller. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: DialogProps) {
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          {/* A plain Button (not AlertDialogAction) so the dialog stays open while pending. */}
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await onConfirm();
                onOpenChange(false);
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type Props = Omit<DialogProps, "open" | "onOpenChange"> & {
  children: ReactNode;
} & Pick<ComponentProps<typeof Button>, "variant" | "size" | "className">;

/** Destructive actions read red even on a plain (ghost/outline) button. */
export const DESTRUCTIVE_TEXT =
  "text-destructive hover:bg-destructive/10 hover:text-destructive";

/** A button that asks for confirmation before running an action. */
export function ConfirmButton({
  children,
  variant = "outline",
  size,
  className,
  ...dialog
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(
          dialog.destructive && variant !== "destructive" && DESTRUCTIVE_TEXT,
          className,
        )}
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <ConfirmDialog open={open} onOpenChange={setOpen} {...dialog} />
    </>
  );
}
