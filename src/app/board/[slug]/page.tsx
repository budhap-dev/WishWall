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

const robots = { index: false, follow: false };

/**
 * Title/description for link previews (WhatsApp etc. read these from the
 * initial HTML; Next renders metadata up front for known preview bots).
 * The image comes from ./opengraph-image.tsx.
 */
export async function generateMetadata({
  params,
}: PageProps<"/board/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const board = isValidSlug(slug) ? await getBoardByShareSlug(slug) : null;
  if (!board) return { title: "Board not found", robots };

  const title = board.title;
  const description =
    board.status === "OPEN"
      ? `Add your message to a group card for ${board.recipientName}.${board.allowGuests ? " No account needed." : ""}`
      : `A group card for ${board.recipientName}.`;
  return {
    title: `Sign the card: ${title}`,
    description,
    robots,
    openGraph: {
      type: "website",
      siteName: "WishWall",
      title,
      description,
      url: `/board/${slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

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
