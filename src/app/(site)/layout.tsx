import { SiteHeader } from "@/components/site/site-header";

// App chrome for the marketing page, sign-in and the owner dashboard. Board
// pages (contribute/reveal/print) live outside this group, so recipients see
// only the card.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
