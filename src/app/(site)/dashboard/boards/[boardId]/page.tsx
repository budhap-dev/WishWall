import { ArrowLeft, PartyPopper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BoardAppearanceForm } from "@/components/dashboard/board-appearance-form";
import { BoardControls } from "@/components/dashboard/board-controls";
import { BoardDetailsForm } from "@/components/dashboard/board-details-form";
import { ModerationList } from "@/components/dashboard/moderation-list";
import { RecipientPhotoForm } from "@/components/dashboard/recipient-photo-form";
import { ShareLinks } from "@/components/dashboard/share-links";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatEventDate, pluralize, toDateInputValue } from "@/lib/format";
import { boardLinks } from "@/lib/links";
import { OCCASIONS } from "@/lib/occasions";
import { idSchema } from "@/lib/validation/common";
import { getOwnedBoard } from "@/server/services/boards";
import { listMessagesForOwner } from "@/server/services/messages";
import { imageUrl, uploadsEnabled } from "@/server/storage";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Manage board" };

type Params = PageProps<"/dashboard/boards/[boardId]">;

export default function ManageBoardPage({ params, searchParams }: Params) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" /> My boards
      </Link>
      <Suspense fallback={<ManageSkeleton />}>
        <ManageBoard params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ManageBoard({ params, searchParams }: Params) {
  const { boardId } = await params;
  const user = await requireUser(`/dashboard/boards/${boardId}`);
  const id = idSchema.safeParse(boardId);
  const board = id.success ? await getOwnedBoard(user.id, id.data) : null;
  // Same 404 for "doesn't exist" and "not yours", so ids can't be probed.
  if (!board) notFound();

  const [{ created }, messages] = await Promise.all([
    searchParams,
    listMessagesForOwner(board.id),
  ]);
  const hiddenCount = messages.filter((m) => m.hidden).length;
  const links = boardLinks(board);
  const occasion = OCCASIONS[board.occasion];
  const isOpen = board.status === "OPEN";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {board.title}
          </h1>
          <Badge variant={isOpen ? "secondary" : "outline"}>
            {isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {occasion.emoji} {occasion.label} for {board.recipientName}
          {board.eventDate
            ? ` · ${formatEventDate(board.eventDate)}`
            : ""} · {pluralize(board._count.messages, "message")}
        </p>
      </header>

      {created === "1" ? (
        <div
          role="status"
          className="flex gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
        >
          <PartyPopper
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium">Your board is ready!</p>
            <p className="text-sm text-muted-foreground">
              Copy the contribute link below and share it with everyone who
              should sign the card. This page is your owner dashboard; bookmark
              it to come back any time.
            </p>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Share</CardTitle>
          <CardDescription>
            Both links are private: only people you send them to can open the
            board.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShareLinks
            boardId={board.id}
            contributeUrl={links.contribute}
            revealUrl={links.reveal}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            {pluralize(messages.length, "message")}
            {hiddenCount ? ` · ${hiddenCount} hidden` : ""}. Hidden messages
            aren&apos;t shown to anyone else.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModerationList messages={messages} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {uploadsEnabled ? (
            <RecipientPhotoForm
              boardId={board.id}
              initial={
                board.recipientPhotoKey
                  ? {
                      key: board.recipientPhotoKey,
                      url: imageUrl(board.recipientPhotoKey)!,
                    }
                  : null
              }
            />
          ) : null}
          <BoardDetailsForm
            boardId={board.id}
            initial={{
              recipientName: board.recipientName,
              title: board.title,
              intro: board.intro ?? "",
              eventDate: toDateInputValue(board.eventDate),
              allowGuests: board.allowGuests,
              messagesVisible: board.messagesVisible,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template</CardTitle>
          <CardDescription>
            Switching template keeps every message; card colours map to the new
            palette.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BoardAppearanceForm
            boardId={board.id}
            title={board.title}
            initial={{ occasion: board.occasion, templateId: board.templateId }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <BoardControls
            boardId={board.id}
            isOpen={isOpen}
            title={board.title}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function ManageSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading board">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
