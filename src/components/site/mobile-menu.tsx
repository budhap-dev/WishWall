"use client";

import { LogIn, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type TouchEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { isActive, navItems } from "./nav-links";
import { SignOutDialog } from "./sign-out-dialog";
import { UserAvatar } from "./user-menu";

type Props = {
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  versionLabel: string;
};

/** Small screens: the header's links and account controls in a side panel. */
export function MobileMenu({ user, versionLabel }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const swipe = useSwipeToClose(() => setOpen(false));

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="size-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[min(20rem,85vw)] touch-pan-y"
          {...swipe}
        >
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold">
              <Logo markClassName="size-6" />
            </SheetTitle>
            <SheetDescription className="sr-only">Main menu</SheetDescription>
          </SheetHeader>

          {user ? (
            <div className="mx-4 flex items-center gap-3 rounded-lg bg-muted p-3">
              <UserAvatar {...user} className="size-10" />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {user.name ?? "Signed in"}
                </p>
                {user.email ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <nav aria-label="Main" className="px-2">
            <ul className="space-y-1">
              {navItems(Boolean(user), true).map(
                ({ href, label, icon: Icon }) => {
                  const active = isActive(href, pathname);
                  return (
                    <li key={href}>
                      <SheetClose asChild>
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                            active && "bg-muted text-primary",
                          )}
                        >
                          <Icon className="size-5" aria-hidden="true" />
                          {label}
                        </Link>
                      </SheetClose>
                    </li>
                  );
                },
              )}
            </ul>
          </nav>

          <SheetFooter className="border-t">
            {user ? (
              <Button
                variant="outline"
                size="lg"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  setOpen(false);
                  setConfirmSignOut(true);
                }}
              >
                <LogOut /> Sign out
              </Button>
            ) : (
              <SheetClose asChild>
                <Button asChild size="lg">
                  <Link href="/signin">
                    <LogIn /> Sign in
                  </Link>
                </Button>
              </SheetClose>
            )}
            <p className="text-center text-xs text-muted-foreground">
              WishWall {versionLabel}
            </p>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <SignOutDialog open={confirmSignOut} onOpenChange={setConfirmSignOut} />
    </>
  );
}

/**
 * Lets the panel be dragged to the right and let go to close it, like a
 * phone's own side panels. A short drag springs back; past a third of the
 * panel (or a quick flick) it closes, sliding on from where the finger left
 * it. Vertical drags are left alone so the panel still scrolls.
 */
function useSwipeToClose(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    x: number;
    y: number;
    time: number;
    dx: number;
    horizontal: boolean | null;
  } | null>(null);

  return {
    ref,
    onTouchStart(event: TouchEvent) {
      const touch = event.touches[0];
      drag.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: event.timeStamp,
        dx: 0,
        horizontal: null,
      };
    },
    onTouchMove(event: TouchEvent) {
      const d = drag.current;
      const panel = ref.current;
      if (!d || !panel) return;
      const touch = event.touches[0];
      const dx = touch.clientX - d.x;
      const dy = touch.clientY - d.y;
      // Decide once, after a few pixels, whether this is a swipe or a scroll.
      d.horizontal ??=
        Math.abs(dx) + Math.abs(dy) > 8 ? Math.abs(dx) > Math.abs(dy) : null;
      if (!d.horizontal) return;
      d.dx = Math.max(0, dx);
      panel.style.transition = "none";
      panel.style.translate = `${d.dx}px 0`;
    },
    onTouchEnd(event: TouchEvent) {
      const d = drag.current;
      const panel = ref.current;
      drag.current = null;
      if (!d?.horizontal || !panel) return;
      const flick = d.dx > 40 && event.timeStamp - d.time < 250;
      if (flick || d.dx > panel.offsetWidth / 3) {
        onClose();
      } else {
        panel.style.transition = "translate 200ms ease-out";
        panel.style.translate = "";
      }
    },
  };
}
