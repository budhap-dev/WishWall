import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PrintBoard } from "@/components/print/print-board";
import { formatEventDate } from "@/lib/format";
import { isValidSlug } from "@/lib/slug";
import { getBoardByRevealSlug } from "@/server/services/boards";
import { listMessagesForReveal } from "@/server/services/messages";
import { imageUrl } from "@/server/storage";

const robots = { index: false, follow: false };

/** The title becomes the PDF's document title. */
export async function generateMetadata({
  params,
}: PageProps<"/board/[slug]/print">): Promise<Metadata> {
  const { slug } = await params;
  const board = isValidSlug(slug) ? await getBoardByRevealSlug(slug) : null;
  return { title: board?.title ?? "Card not found", robots };
}

/**
 * Printable board, keyed by the reveal slug like the recipient's view.
 * /board/[slug]/pdf renders it to a PDF; it also prints well from a browser.
 */
export default function PrintPage({
  params,
}: PageProps<"/board/[slug]/print">) {
  return (
    <Suspense fallback={null}>
      <Print params={params} />
    </Suspense>
  );
}

async function Print({
  params,
}: Pick<PageProps<"/board/[slug]/print">, "params">) {
  const { slug } = await params;
  const board = isValidSlug(slug) ? await getBoardByRevealSlug(slug) : null;
  if (!board) notFound();
  const messages = await listMessagesForReveal(board.id);

  return (
    <PrintBoard
      board={{
        id: board.id,
        title: board.title,
        intro: board.intro,
        recipientName: board.recipientName,
        recipientPhotoUrl: imageUrl(board.recipientPhotoKey),
        eventDateLabel: board.eventDate
          ? formatEventDate(board.eventDate)
          : null,
        occasion: board.occasion,
        templateId: board.templateId,
      }}
      messages={messages}
    />
  );
}
