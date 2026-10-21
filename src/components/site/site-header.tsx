import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/server/session";
import { UserMenu } from "./user-menu";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="rounded-sm font-heading text-xl font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Wish<span className="text-primary">Wall</span>
        </Link>
        {/* Reads the session cookie, so it streams in behind a boundary. */}
        <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
          <UserNav />
        </Suspense>
      </div>
    </header>
  );
}

async function UserNav() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/signin">Sign in</Link>
      </Button>
    );
  }
  return <UserMenu name={user.name} email={user.email} image={user.image} />;
}
