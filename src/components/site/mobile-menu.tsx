"use client";

import { LogIn, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { signOutAction } from "@/server/actions/auth";
import { Logo } from "./logo";
import { isActive, navItems } from "./nav-links";
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

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
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
              <p className="truncate font-medium">{user.name ?? "Signed in"}</p>
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
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
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
            <Button variant="outline" onClick={() => void signOutAction()}>
              <LogOut /> Sign out
            </Button>
          ) : (
            <SheetClose asChild>
              <Button asChild>
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
  );
}
