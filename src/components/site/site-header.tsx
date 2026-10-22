import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { versionLabel } from "@/lib/version";
import { getCurrentUser } from "@/server/session";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

/** Logo and navigation: links in the bar on desktop, a side panel on mobile. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Link
          href="/"
          className="rounded-sm font-heading text-xl font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Logo />
        </Link>
        {/* Reads the session cookie, so it streams in behind a boundary. */}
        <Suspense
          fallback={<Skeleton className="ml-auto size-8 rounded-full" />}
        >
          <HeaderNav />
        </Suspense>
      </div>
    </header>
  );
}

async function HeaderNav() {
  const user = await getCurrentUser();
  return (
    <>
      <NavLinks signedIn={Boolean(user)} className="hidden sm:block" />
      <div className="ml-auto hidden sm:block">
        {user ? (
          <UserMenu name={user.name} email={user.email} image={user.image} />
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link href="/signin">Sign in</Link>
          </Button>
        )}
      </div>
      <div className="ml-auto sm:hidden">
        <MobileMenu
          user={
            user
              ? { name: user.name, email: user.email, image: user.image }
              : null
          }
          versionLabel={versionLabel}
        />
      </div>
    </>
  );
}
