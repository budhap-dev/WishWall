import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import type { MessageContentData } from "@/lib/validation/message";
import { db } from "@/server/db";
import { deleteImages, imageUrl } from "@/server/storage";

/**
 * Message persistence and the rules for who may see or change what:
 *
 * - Hidden messages are only ever shown to the board owner (dashboard).
 * - In surprise mode (board.messagesVisible = false) contributors see only
 *   their own messages; the owner and the reveal page see everything.
 * - A message can be edited/deleted by its signed-in author, or by a guest
 *   holding the edit token issued when they posted. Only the token's SHA-256
 *   is stored, so a database leak doesn't grant edit rights.
 * - The board owner can hide/unhide/delete any message on their boards.
 */

export function newEditToken(): string {
  return randomBytes(24).toString("base64url"); // 32 chars
}

export function hashEditToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const MESSAGE_SELECT = {
  id: true,
  boardId: true,
  authorName: true,
  authorId: true,
  body: true,
  imageKey: true,
  imageAlt: true,
  imageWidth: true,
  imageHeight: true,
  cardColor: true,
  font: true,
  textColor: true,
  hidden: true,
  createdAt: true,
  updatedAt: true,
} as const;

type MessageRow = Prisma.MessageGetPayload<{ select: typeof MESSAGE_SELECT }>;

/** What the browser receives. Never includes editTokenHash or authorId. */
export type MessageView = {
  id: string;
  authorName: string;
  body: string;
  /** `key` lets an author keep the existing image when editing (keys aren't secret: they're in the URL). */
  image: {
    key: string;
    url: string;
    width: number;
    height: number;
    alt: string;
  } | null;
  cardColor: string;
  font: string | null;
  textColor: string | null;
  createdAt: string;
  edited: boolean;
  /** True when the signed-in viewer wrote it (guests are matched client-side by token). */
  isMine: boolean;
};

export function toView(row: MessageRow, viewerId?: string | null): MessageView {
  const url = imageUrl(row.imageKey);
  return {
    id: row.id,
    authorName: row.authorName,
    body: row.body,
    image:
      url && row.imageWidth && row.imageHeight
        ? {
            key: row.imageKey!,
            url,
            width: row.imageWidth,
            height: row.imageHeight,
            alt: row.imageAlt ?? "",
          }
        : null,
    cardColor: row.cardColor,
    font: row.font,
    textColor: row.textColor,
    createdAt: row.createdAt.toISOString(),
    edited: row.updatedAt.getTime() - row.createdAt.getTime() > 5_000,
    isMine: Boolean(viewerId && row.authorId === viewerId),
  };
}

/** Messages a contributor may see on the contribute page. */
export async function listMessagesForContributor(
  board: { id: string; messagesVisible: boolean; ownerId: string },
  viewerId: string | null,
): Promise<MessageView[]> {
  const seesAll = board.messagesVisible || viewerId === board.ownerId;
  if (!seesAll && !viewerId) return [];
  const rows = await db.message.findMany({
    where: {
      boardId: board.id,
      hidden: false,
      ...(seesAll ? {} : { authorId: viewerId }),
    },
    orderBy: { createdAt: "asc" },
    select: MESSAGE_SELECT,
  });
  return rows.map((row) => toView(row, viewerId));
}

/**
 * Everything on the board for the recipient's reveal: all non-hidden
 * messages, whatever the surprise-mode setting (that only limits contributors).
 */
export async function listMessagesForReveal(
  boardId: string,
): Promise<MessageView[]> {
  const rows = await db.message.findMany({
    where: { boardId, hidden: false },
    orderBy: { createdAt: "asc" },
    select: MESSAGE_SELECT,
  });
  return rows.map((row) => toView(row));
}

/** A guest's own messages, proven by the tokens in their browser (for surprise mode). */
export async function listMessagesByTokens(
  boardId: string,
  tokens: string[],
): Promise<MessageView[]> {
  if (tokens.length === 0) return [];
  const rows = await db.message.findMany({
    where: {
      boardId,
      hidden: false,
      editTokenHash: { in: tokens.map(hashEditToken) },
    },
    orderBy: { createdAt: "asc" },
    select: MESSAGE_SELECT,
  });
  return rows.map((row) => toView(row));
}

/** All messages including hidden ones, for the owner's moderation list. */
export async function listMessagesForOwner(boardId: string) {
  const rows = await db.message.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
    select: MESSAGE_SELECT,
  });
  return rows.map((row) => ({ ...toView(row), hidden: row.hidden }));
}

export async function createMessage(
  boardId: string,
  content: MessageContentData,
  authorId: string | null,
): Promise<{ message: MessageView; editToken: string | null }> {
  // Signed-in authors are recognised by their account; guests get a token.
  const editToken = authorId ? null : newEditToken();
  const row = await db.message.create({
    data: {
      boardId,
      authorId,
      editTokenHash: editToken ? hashEditToken(editToken) : null,
      ...contentToColumns(content),
    },
    select: MESSAGE_SELECT,
  });
  return { message: toView(row, authorId), editToken };
}

export type Authorship = { userId: string | null; editToken: string | null };

/**
 * Loads a message on a given board if the caller authored it, else null.
 * Checks the board too, so a token can't be replayed against another board.
 */
async function findOwnMessage(
  boardId: string,
  messageId: string,
  who: Authorship,
) {
  const row = await db.message.findFirst({
    where: { id: messageId, boardId },
    select: { ...MESSAGE_SELECT, editTokenHash: true },
  });
  if (!row) return null;
  const byUser = who.userId !== null && row.authorId === who.userId;
  const byToken =
    who.editToken !== null &&
    row.editTokenHash !== null &&
    row.editTokenHash === hashEditToken(who.editToken);
  return byUser || byToken ? row : null;
}

export type UpdateResult =
  | { ok: true; message: MessageView }
  | { ok: false; reason: "not-found" | "bad-image" };

/**
 * Updates a message the caller authored. A *new* image must pass
 * `isNewImageValid` (signature check); keeping the current image is allowed
 * as-is, using the stored dimensions rather than whatever the client sent.
 */
export async function updateOwnMessage(
  boardId: string,
  messageId: string,
  who: Authorship,
  content: MessageContentData,
  isNewImageValid: (image: NonNullable<MessageContentData["image"]>) => boolean,
): Promise<UpdateResult> {
  const existing = await findOwnMessage(boardId, messageId, who);
  if (!existing) return { ok: false, reason: "not-found" };

  let image = content.image;
  if (image && image.key === existing.imageKey) {
    image = {
      ...image,
      width: existing.imageWidth!,
      height: existing.imageHeight!,
    };
  } else if (image && !isNewImageValid(image)) {
    return { ok: false, reason: "bad-image" };
  }

  const row = await db.message.update({
    where: { id: existing.id },
    data: contentToColumns({ ...content, image }),
    select: MESSAGE_SELECT,
  });
  if (existing.imageKey && existing.imageKey !== row.imageKey) {
    await deleteImages([existing.imageKey]);
  }
  return { ok: true, message: toView(row, who.userId) };
}

export async function deleteOwnMessage(
  boardId: string,
  messageId: string,
  who: Authorship,
): Promise<boolean> {
  const existing = await findOwnMessage(boardId, messageId, who);
  if (!existing) return false;
  await db.message.delete({ where: { id: existing.id } });
  await deleteImages([existing.imageKey]);
  return true;
}

// ─── Owner moderation (scoped through the board's owner) ──────────────────

export async function setMessageHidden(
  ownerId: string,
  messageId: string,
  hidden: boolean,
): Promise<boolean> {
  const { count } = await db.message.updateMany({
    where: { id: messageId, board: { ownerId } },
    data: { hidden },
  });
  return count === 1;
}

export async function deleteMessageAsOwner(
  ownerId: string,
  messageId: string,
): Promise<boolean> {
  const row = await db.message.findFirst({
    where: { id: messageId, board: { ownerId } },
    select: { id: true, imageKey: true },
  });
  if (!row) return false;
  await db.message.delete({ where: { id: row.id } });
  await deleteImages([row.imageKey]);
  return true;
}

function contentToColumns(content: MessageContentData) {
  return {
    authorName: content.authorName,
    body: content.body ?? "",
    cardColor: content.cardColor,
    font: content.font,
    textColor: content.textColor,
    imageKey: content.image?.key ?? null,
    imageAlt: content.image ? content.image.alt || null : null,
    imageWidth: content.image?.width ?? null,
    imageHeight: content.image?.height ?? null,
  };
}
