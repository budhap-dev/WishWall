import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RevealExperience } from "@/components/reveal/reveal-experience";
import { formatEventDate } from "@/lib/format";
import { isValidSlug } from "@/lib/slug";
import { getBoardByRevealSlug } from "@/server/services/boards";
import { listMessagesForReveal } from "@/server/services/messages";
import { imageUrl } from "@/server/storage";

const robots = { index: false, follow: false };

/** Link-preview text for the recipient's link: no spoilers, just who it's for. */
export async function generateMetadata({
  params,
}: PageProps<"/board/[slug]/reveal">): Promise<Metadata> {
  const { slug } = await params;
  const board = isValidSlug(slug) ? await getBoardByRevealSlug(slug) : null;
  if (!board) return { title: "Card not found", robots };

  const title = `A card for ${board.recipientName} 💌`;
  const description = "Friends and family made you something. Tap to open it.";
  return {
    title,
    description,
    robots,
    openGraph: {
      type: "website",
      siteName: "WishWall",
      title,
      description,
      url: `/board/${slug}/reveal`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * The recipient's view, reached only via the board's reveal link (a different
 * slug from the contribute link, so contributors can't open it early).
 */
export default function RevealPage({
  params,
}: PageProps<"/board/[slug]/reveal">) {
  return (
    <Suspense
      fallback={<div className="min-h-dvh bg-muted" aria-busy="true" />}
    >
      <Reveal params={params} />
    </Suspense>
  );
}

async function Reveal({
  params,
}: Pick<PageProps<"/board/[slug]/reveal">, "params">) {
  const { slug } = await params;
  const board = isValidSlug(slug) ? await getBoardByRevealSlug(slug) : null;
  if (!board) notFound();
  const messages = await listMessagesForReveal(board.id);

  return (
    <RevealExperience
      board={{
        id: board.id,
        title: board.title,
        recipientName: board.recipientName,
        recipientPhotoUrl: imageUrl(board.recipientPhotoKey),
        eventDateLabel: board.eventDate
          ? formatEventDate(board.eventDate)
          : null,
        occasion: board.occasion,
        templateId: board.templateId,
      }}
      messages={messages}
      revealSlug={slug}
    />
  );
}
