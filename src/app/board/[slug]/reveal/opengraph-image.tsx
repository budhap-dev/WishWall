import { isValidSlug } from "@/lib/slug";
import { OG_SIZE, revealOgImage } from "@/server/og";
import { getBoardByRevealSlug } from "@/server/services/boards";
import { defaultTemplateFor, resolveTemplate } from "@/templates";

export const alt = "You've got a card on WishWall";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Link-preview image for the recipient's link: a sealed envelope, no spoilers. */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const board = isValidSlug(slug) ? await getBoardByRevealSlug(slug) : null;
  return revealOgImage({
    template: board
      ? resolveTemplate(board.templateId, board.occasion)
      : defaultTemplateFor("BIRTHDAY"),
    recipientName: board?.recipientName ?? "you",
  });
}
