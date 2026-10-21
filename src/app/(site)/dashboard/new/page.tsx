import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateBoardWizard } from "@/components/wizard/create-board-wizard";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "New board" };

export default function NewBoardPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <h1 className="sr-only">Create a board</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <SignedInWizard />
      </Suspense>
    </main>
  );
}

async function SignedInWizard() {
  await requireUser("/dashboard/new");
  return <CreateBoardWizard />;
}
