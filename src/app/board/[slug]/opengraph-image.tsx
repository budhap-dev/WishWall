import { isValidSlug } from "@/lib/slug";
import { contributeOgImage, OG_SIZE } from "@/server/og";
import {
  countVisibleMessages,
  getBoardByShareSlug,
} from "@/server/services/boards";
import { defaultTemplateFor, resolveTemplate } from "@/templates";

export const alt = "A group card on WishWall";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Link-preview image for the contribute link (WhatsApp, iMessage, Slack…). */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const board = isValidSlug(slug) ? await getBoardByShareSlug(slug) : null;
  if (!board) {
    return contributeOgImage({
      template: defaultTemplateFor("BIRTHDAY"),
      title: "WishWall",
      recipientName: "someone special",
      messageCount: 0,
    });
  }
  return contributeOgImage({
    template: resolveTemplate(board.templateId, board.occasion),
    title: board.title,
    recipientName: board.recipientName,
    messageCount: await countVisibleMessages(board.id),
  });
}
