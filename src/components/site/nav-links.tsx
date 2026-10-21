"use client";

import { Home, LayoutGrid, type LucideIcon, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

/** The app's main destinations; "Home" is only listed where there's no logo link beside it. */
export function navItems(signedIn: boolean, withHome = false): NavItem[] {
  const home: NavItem[] = withHome
    ? [{ href: "/", label: "Home", icon: Home }]
    : [];
  return signedIn
    ? [
        ...home,
        { href: "/dashboard", label: "My boards", icon: LayoutGrid },
        { href: "/dashboard/new", label: "New board", icon: Plus },
      ]
    : [
        ...home,
        { href: "/dashboard/new", label: "Create a board", icon: Plus },
      ];
}

/** "My boards" stays highlighted while managing one of them. */
export function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    return pathname === href || pathname.startsWith("/dashboard/boards/");
  }
  return pathname === href;
}

/** Desktop header links. */
export function NavLinks({
  signedIn,
  className,
}: {
  signedIn: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex items-center gap-1">
        {navItems(signedIn).map(({ href, label }) => {
          const active = isActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  active && "bg-muted text-foreground",
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
