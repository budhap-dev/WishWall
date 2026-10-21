import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEventDate, pluralize } from "@/lib/format";
import { OCCASIONS } from "@/lib/occasions";
import { listBoardsForOwner } from "@/server/services/boards";
import { requireUser } from "@/server/session";
import { resolveTemplate } from "@/templates";

export const metadata: Metadata = { title: "My boards" };

export default function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          My boards
        </h1>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus /> New board
          </Link>
        </Button>
      </div>
      <Suspense fallback={null}>
        <DeletedNotice searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<BoardGridSkeleton />}>
        <BoardGrid />
      </Suspense>
    </main>
  );
}

async function DeletedNotice({
  searchParams,
}: Pick<PageProps<"/dashboard">, "searchParams">) {
  const { deleted } = await searchParams;
  if (deleted !== "1") return null;
  return (
    <p
      role="status"
      className="mb-6 rounded-md border bg-muted px-4 py-3 text-sm"
    >
      Board deleted.
    </p>
  );
}

async function BoardGrid() {
  const user = await requireUser();
  const boards = await listBoardsForOwner(user.id);

  if (boards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-16 text-center">
        <p className="text-4xl" aria-hidden="true">
          💌
        </p>
        <h2 className="mt-4 text-lg font-semibold">No boards yet</h2>
        <p className="mx-auto mt-1 max-w-sm text-muted-foreground">
          Create a board, share the link, and watch the messages roll in.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/new">
            <Plus /> Create your first board
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {boards.map((board) => (
        <li key={board.id}>
          <Link
            href={`/dashboard/boards/${board.id}`}
            className="group block overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <TemplatePreview
              template={resolveTemplate(board.templateId, board.occasion)}
              title={board.title}
              size="compact"
              className="rounded-none"
            />
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold group-hover:underline">
                  {board.title}
                </h2>
                <Badge
                  variant={board.status === "OPEN" ? "secondary" : "outline"}
                >
                  {board.status === "OPEN" ? "Open" : "Closed"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {OCCASIONS[board.occasion].emoji}{" "}
                {OCCASIONS[board.occasion].label} for {board.recipientName}
                {board.eventDate
                  ? ` · ${formatEventDate(board.eventDate)}`
                  : ""}
              </p>
              <p className="text-sm">
                {pluralize(board._count.messages, "message")}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function BoardGridSkeleton() {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading boards"
    >
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </div>
  );
}
