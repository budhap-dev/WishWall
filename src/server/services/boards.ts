import "server-only";
import { BoardStatus } from "@/generated/prisma/enums";
import { generateSlug } from "@/lib/slug";
import type {
  BoardAppearanceData,
  BoardDetailsData,
  CreateBoardData,
} from "@/lib/validation/board";
import { db } from "@/server/db";

/**
 * Board persistence. Every owner operation filters by BOTH board id and
 * owner id, so a forged id can never touch someone else's board: it simply
 * matches nothing and the caller gets null/false.
 */

export async function createBoard(ownerId: string, data: CreateBoardData) {
  return db.board.create({
    data: {
      ...data,
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
  // Messages cascade in the database. Uploaded images are cleaned up once
  // storage lands (Phase 3).
  const { count } = await db.board.deleteMany({
    where: { id: boardId, ownerId },
  });
  return count === 1;
}
