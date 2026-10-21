"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { isValidSlug } from "@/lib/slug";
import {
  type ActionResult,
  fieldErrorResult,
  idSchema,
} from "@/lib/validation/common";
import {
  createMessageSchema,
  editTokenSchema,
  messageContentSchema,
} from "@/lib/validation/message";
import { verifyCaptcha } from "@/server/captcha";
import { clientIp, clientIpKey } from "@/server/client-ip";
import { consumeRateLimit, retryAfterText } from "@/server/rate-limit";
import {
  getBoardByShareSlug,
  type PublicBoard,
} from "@/server/services/boards";
import * as messages from "@/server/services/messages";
import { getCurrentUser, requireUser } from "@/server/session";
import { isVerifiedUpload } from "@/server/verify-image";

// Contributor actions are callable by anyone holding a board's share link,
// so each one re-checks the board (exists, open, guests allowed), the caller
// (session or edit token), rate limits, and validates every field.

const HOUR = 60 * 60;
const BOARD_GONE = "This board no longer exists, or its link has changed.";
const CLOSED = "This board is closed to new messages.";

async function loadBoard(shareSlug: unknown): Promise<PublicBoard | null> {
  if (typeof shareSlug !== "string" || !isValidSlug(shareSlug)) return null;
  return getBoardByShareSlug(shareSlug);
}

const optionalToken = editTokenSchema.nullable();

export async function createMessageAction(
  shareSlug: unknown,
  input: unknown,
): Promise<
  ActionResult<{ message: messages.MessageView; editToken: string | null }>
> {
  const board = await loadBoard(shareSlug);
  if (!board) return { ok: false, error: BOARD_GONE };
  if (board.status !== "OPEN") return { ok: false, error: CLOSED };

  const user = await getCurrentUser();
  if (!user && !board.allowGuests) {
    return { ok: false, error: "Please sign in to post on this board." };
  }

  const parsed = createMessageSchema.safeParse(input);
  if (!parsed.success) return fieldErrorResult(parsed.error);
  const { captchaToken, ...content } = parsed.data;
  if (content.image && !isVerifiedUpload(content.image, "messages")) {
    return {
      ok: false,
      error: "That image upload is invalid. Please upload it again.",
    };
  }

  const requestHeaders = await headers();
  if (!user && !(await verifyCaptcha(captchaToken, clientIp(requestHeaders)))) {
    return {
      ok: false,
      error: "Please complete the “I'm human” check and try again.",
    };
  }

  const perIp = await consumeRateLimit(
    `msg:ip:${clientIpKey(requestHeaders)}`,
    env.RATE_LIMIT_PER_IP,
    HOUR,
  );
  if (!perIp.ok) {
    return {
      ok: false,
      error: `You're posting very quickly. Please try again in ${retryAfterText(perIp.resetAt)}.`,
    };
  }
  const perBoard = await consumeRateLimit(
    `msg:board:${board.id}`,
    env.RATE_LIMIT_PER_BOARD,
    HOUR,
  );
  if (!perBoard.ok) {
    return {
      ok: false,
      error: `This board is getting lots of messages right now. Please try again in ${retryAfterText(perBoard.resetAt)}.`,
    };
  }

  const result = await messages.createMessage(
    board.id,
    content,
    user?.id ?? null,
  );
  refresh();
  return { ok: true, data: result };
}

export async function updateMessageAction(
  shareSlug: unknown,
  messageId: unknown,
  editToken: unknown,
  input: unknown,
): Promise<ActionResult<{ message: messages.MessageView }>> {
  const board = await loadBoard(shareSlug);
  if (!board) return { ok: false, error: BOARD_GONE };
  if (board.status !== "OPEN")
    return {
      ok: false,
      error: "This board is closed, so messages can't be edited.",
    };

  const id = idSchema.safeParse(messageId);
  const token = optionalToken.safeParse(editToken ?? null);
  if (!id.success || !token.success)
    return { ok: false, error: "Message not found." };
  const parsed = messageContentSchema.safeParse(input);
  if (!parsed.success) return fieldErrorResult(parsed.error);

  const limit = await consumeRateLimit(
    `edit:ip:${clientIpKey(await headers())}`,
    60,
    HOUR,
  );
  if (!limit.ok)
    return { ok: false, error: "Too many edits. Please try again later." };

  const user = await getCurrentUser();
  const result = await messages.updateOwnMessage(
    board.id,
    id.data,
    { userId: user?.id ?? null, editToken: token.data },
    parsed.data,
    (image) => isVerifiedUpload(image, "messages"),
  );
  if (!result.ok) {
    return {
      ok: false,
      error:
        result.reason === "bad-image"
          ? "That image upload is invalid. Please upload it again."
          : "You can only edit your own messages.",
    };
  }
  refresh();
  return { ok: true, data: { message: result.message } };
}

export async function deleteMessageAction(
  shareSlug: unknown,
  messageId: unknown,
  editToken: unknown,
): Promise<ActionResult> {
  const board = await loadBoard(shareSlug);
  if (!board) return { ok: false, error: BOARD_GONE };
  const id = idSchema.safeParse(messageId);
  const token = optionalToken.safeParse(editToken ?? null);
  if (!id.success || !token.success)
    return { ok: false, error: "Message not found." };

  const user = await getCurrentUser();
  const deleted = await messages.deleteOwnMessage(board.id, id.data, {
    userId: user?.id ?? null,
    editToken: token.data,
  });
  if (!deleted)
    return { ok: false, error: "You can only delete your own messages." };
  refresh();
  return { ok: true, data: undefined };
}

/** A guest's own messages (by the tokens in their browser), for surprise mode. */
export async function getMyMessagesAction(
  shareSlug: unknown,
  tokens: unknown,
): Promise<messages.MessageView[]> {
  const board = await loadBoard(shareSlug);
  const parsed = z.array(editTokenSchema).max(50).safeParse(tokens);
  if (!board || !parsed.success) return [];
  return messages.listMessagesByTokens(board.id, parsed.data);
}

// ─── Owner moderation ──────────────────────────────────────────────────────

export async function setMessageHiddenAction(
  messageId: unknown,
  hidden: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const id = idSchema.safeParse(messageId);
  const flag = z.boolean().safeParse(hidden);
  if (!id.success || !flag.success)
    return { ok: false, error: "Message not found." };
  if (!(await messages.setMessageHidden(user.id, id.data, flag.data))) {
    return { ok: false, error: "Message not found." };
  }
  refresh();
  return { ok: true, data: undefined };
}

export async function deleteMessageAsOwnerAction(
  messageId: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const id = idSchema.safeParse(messageId);
  if (!id.success || !(await messages.deleteMessageAsOwner(user.id, id.data))) {
    return { ok: false, error: "Message not found." };
  }
  refresh();
  return { ok: true, data: undefined };
}
