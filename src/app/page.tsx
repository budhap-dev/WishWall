import { Button } from "@/components/ui/button";

// Placeholder landing page; sign-in and the create-board wizard arrive in Phase 2.
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <p className="text-sm font-medium tracking-wide text-primary uppercase">
        Group cards, made together
      </p>
      <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
        One wall. Everyone&apos;s wishes.
      </h1>
      <p className="max-w-xl text-lg text-pretty text-muted-foreground">
        Create a board for a birthday, farewell or any occasion, share the link
        so friends can add messages, photos and GIFs, then reveal it as an
        animated card or download it as a PDF.
      </p>
      <Button size="lg" disabled>
        Create a board (coming soon)
      </Button>
    </main>
  );
}
