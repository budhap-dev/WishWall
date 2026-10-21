import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ContributeBoard } from "@/components/messages/contribute-board";
import { formatEventDate } from "@/lib/format";
import { isValidSlug } from "@/lib/slug";
import { captchaSiteKey } from "@/server/captcha";
import { getBoardByShareSlug } from "@/server/services/boards";
import { listMessagesForContributor } from "@/server/services/messages";
import { getCurrentUser } from "@/server/session";
import { imageUrl, uploadsEnabled } from "@/server/storage";

export const metadata: Metadata = {
  title: "Sign the card",
  robots: { index: false, follow: false },
};

/** The contribute page, reached via a board's share link. */
export default function BoardPage({ params }: PageProps<"/board/[slug]">) {
  return (
    <Suspense
      fallback={<div className="min-h-dvh bg-muted" aria-busy="true" />}
    >
      <Board params={params} />
    </Suspense>
  );
}

async function Board({ params }: Pick<PageProps<"/board/[slug]">, "params">) {
  const { slug } = await params;
  const board = isValidSlug(slug) ? await getBoardByShareSlug(slug) : null;
  if (!board) notFound();

  const user = await getCurrentUser();
  const messages = await listMessagesForContributor(board, user?.id ?? null);

  return (
    <ContributeBoard
      board={{
        id: board.id,
        shareSlug: slug,
        title: board.title,
        intro: board.intro,
        recipientName: board.recipientName,
        recipientPhotoUrl: imageUrl(board.recipientPhotoKey),
        eventDateLabel: board.eventDate
          ? formatEventDate(board.eventDate)
          : null,
        occasion: board.occasion,
        templateId: board.templateId,
        isOpen: board.status === "OPEN",
        allowGuests: board.allowGuests,
        messagesVisible: board.messagesVisible,
      }}
      messages={messages}
      viewer={{
        signedIn: Boolean(user),
        name: user?.name ?? null,
        isOwner: user?.id === board.ownerId,
      }}
      captchaSiteKey={captchaSiteKey()}
      uploadsEnabled={uploadsEnabled}
      signInHref={`/signin?callbackUrl=${encodeURIComponent(`/board/${slug}`)}`}
    />
  );
}
