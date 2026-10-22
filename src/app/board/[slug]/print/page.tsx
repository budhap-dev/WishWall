import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PrintBook } from "@/components/print/print-book";
import { formatEventDate } from "@/lib/format";
import { parsePaper } from "@/lib/print-layout";
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
 * Printable board (`?paper=a4|letter`), keyed by the reveal slug like the
 * recipient's view. /board/[slug]/pdf renders it to a PDF, and the download
 * preview shows it in a frame; it also prints well from a browser.
 */
export default function PrintPage({
  params,
  searchParams,
}: PageProps<"/board/[slug]/print">) {
  return (
    <Suspense fallback={null}>
      <Print params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Print({
  params,
  searchParams,
}: Pick<PageProps<"/board/[slug]/print">, "params" | "searchParams">) {
  const { slug } = await params;
  const board = isValidSlug(slug) ? await getBoardByRevealSlug(slug) : null;
  if (!board) notFound();
  const [messages, { paper }] = await Promise.all([
    listMessagesForReveal(board.id),
    searchParams,
  ]);

  return (
    <PrintBook
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
      paper={parsePaper(paper)}
    />
  );
}
