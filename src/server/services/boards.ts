import "server-only";
import { BoardStatus } from "@/generated/prisma/enums";
import { generateSlug } from "@/lib/slug";
import type {
  BoardAppearanceData,
  BoardDetailsData,
  CreateBoardData,
} from "@/lib/validation/board";
import { db } from "@/server/db";
import { deleteImages } from "@/server/storage";

/**
 * Board persistence. Every owner operation filters by BOTH board id and
 * owner id, so a forged id can never touch someone else's board: it simply
 * matches nothing and the caller gets null/false.
 */

export async function createBoard(
  ownerId: string,
  data: Omit<CreateBoardData, "recipientPhoto">,
  recipientPhotoKey: string | null,
) {
  return db.board.create({
    data: {
      ...data,
      recipientPhotoKey,
      ownerId,
      shareSlug: generateSlug(),
      revealSlug: generateSlug(),
    },
    select: { id: true },
  });
}

export async function listBoardsForOwner(ownerId: string) {
  return db.board.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      recipientName: true,
      occasion: true,
      templateId: true,
      status: true,
      eventDate: true,
      createdAt: true,
      _count: { select: { messages: true } },
    },
  });
}

export async function getOwnedBoard(ownerId: string, boardId: string) {
  return db.board.findFirst({
    where: { id: boardId, ownerId },
    include: { _count: { select: { messages: true } } },
  });
}

export type OwnedBoard = NonNullable<Awaited<ReturnType<typeof getOwnedBoard>>>;

/** Returns true if a board owned by `ownerId` was updated. */
async function updateOwned(
  ownerId: string,
  boardId: string,
  data: Parameters<typeof db.board.updateMany>[0]["data"],
): Promise<boolean> {
  const { count } = await db.board.updateMany({
    where: { id: boardId, ownerId },
    data,
  });
  return count === 1;
}

export function updateBoardDetails(
  ownerId: string,
  boardId: string,
  data: BoardDetailsData,
) {
  return updateOwned(ownerId, boardId, data);
}

export function updateBoardAppearance(
  ownerId: string,
  boardId: string,
  data: BoardAppearanceData,
) {
  return updateOwned(ownerId, boardId, data);
}

export function setBoardStatus(
  ownerId: string,
  boardId: string,
  open: boolean,
) {
  return updateOwned(ownerId, boardId, {
    status: open ? BoardStatus.OPEN : BoardStatus.CLOSED,
  });
}

/** Replaces a link slug; the old link stops working immediately. */
export function regenerateSlug(
  ownerId: string,
  boardId: string,
  link: "share" | "reveal",
) {
  return updateOwned(
    ownerId,
    boardId,
    link === "share"
      ? { shareSlug: generateSlug() }
      : { revealSlug: generateSlug() },
  );
}

export async function deleteBoard(
  ownerId: string,
  boardId: string,
): Promise<boolean> {
  const board = await db.board.findFirst({
    where: { id: boardId, ownerId },
    select: {
      recipientPhotoKey: true,
      messages: { select: { imageKey: true } },
    },
  });
  if (!board) return false;
  // Messages cascade in the database; their images are removed from storage after.
  const { count } = await db.board.deleteMany({
    where: { id: boardId, ownerId },
  });
  if (count === 1) {
    await deleteImages([
      board.recipientPhotoKey,
      ...board.messages.map((m) => m.imageKey),
    ]);
  }
  return count === 1;
}

/** Sets or clears the recipient photo; the previous file is deleted. */
export async function setRecipientPhoto(
  ownerId: string,
  boardId: string,
  key: string | null,
): Promise<boolean> {
  const board = await db.board.findFirst({
    where: { id: boardId, ownerId },
    select: { recipientPhotoKey: true },
  });
  if (!board) return false;
  await db.board.update({
    where: { id: boardId },
    data: { recipientPhotoKey: key },
  });
  if (board.recipientPhotoKey && board.recipientPhotoKey !== key) {
    await deleteImages([board.recipientPhotoKey]);
  }
  return true;
}

// ─── Public (contributor) access, by unguessable slug ─────────────────────

const PUBLIC_BOARD_SELECT = {
  id: true,
  ownerId: true,
  recipientName: true,
  recipientPhotoKey: true,
  occasion: true,
  title: true,
  intro: true,
  templateId: true,
  eventDate: true,
  status: true,
  allowGuests: true,
  messagesVisible: true,
} as const;

export function getBoardByShareSlug(shareSlug: string) {
  return db.board.findUnique({
    where: { shareSlug },
    select: PUBLIC_BOARD_SELECT,
  });
}

export type PublicBoard = NonNullable<
  Awaited<ReturnType<typeof getBoardByShareSlug>>
>;
