import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-5xl" aria-hidden="true">
        🔍
      </p>
      <h1 className="font-heading text-3xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        This link may be wrong, expired, or the board may have been deleted. If
        someone shared it with you, ask them for a fresh link.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Go to WishWall</Link>
      </Button>
    </main>
  );
}
