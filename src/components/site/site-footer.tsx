import { versionLabel } from "@/lib/version";

export function SiteFooter() {
  return (
    <footer className="border-t py-4 text-center text-xs text-muted-foreground">
      WishWall {versionLabel}
    </footer>
  );
}
