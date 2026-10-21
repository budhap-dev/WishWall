"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  type ActionResult,
  fieldErrorResult,
  idSchema,
} from "@/lib/validation/common";
import {
  boardAppearanceSchema,
  boardDetailsSchema,
  createBoardSchema,
} from "@/lib/validation/board";
import { uploadedImageSchema } from "@/lib/validation/message";
import * as boards from "@/server/services/boards";
import { requireUser } from "@/server/session";
import { isVerifiedUpload } from "@/server/verify-image";

// Server Actions are public HTTP endpoints: each one re-checks the session,
// validates its input with Zod (never trusting client types), and relies on
// the service layer's owner-scoped queries for authorization.

const NOT_FOUND: ActionResult<never> = {
  ok: false,
  error: "Board not found, or you don't own it.",
};

export async function createBoardAction(
  input: unknown,
): Promise<ActionResult<never>> {
  const user = await requireUser("/dashboard/new");
  const parsed = createBoardSchema.safeParse(input);
  if (!parsed.success) return fieldErrorResult(parsed.error);

  const { recipientPhoto, ...data } = parsed.data;
  if (recipientPhoto && !isVerifiedUpload(recipientPhoto, "recipients")) {
    return {
      ok: false,
      error: "That photo upload is invalid. Please upload it again.",
    };
  }

  const board = await boards.createBoard(
    user.id,
    data,
    recipientPhoto?.key ?? null,
  );
  redirect(`/dashboard/boards/${board.id}?created=1`);
}

/** Sets (or clears, with null) the recipient's photo. */
export async function setRecipientPhotoAction(
  boardId: unknown,
  photo: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const id = idSchema.safeParse(boardId);
  if (!id.success) return NOT_FOUND;
  const parsed = uploadedImageSchema.nullable().safeParse(photo);
  if (
    !parsed.success ||
    (parsed.data && !isVerifiedUpload(parsed.data, "recipients"))
  ) {
    return {
      ok: false,
      error: "That photo upload is invalid. Please upload it again.",
    };
  }

  if (
    !(await boards.setRecipientPhoto(
      user.id,
      id.data,
      parsed.data?.key ?? null,
    ))
  ) {
    return NOT_FOUND;
  }
  refresh();
  return { ok: true, data: undefined };
}

export async function updateBoardDetailsAction(
  boardId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const id = idSchema.safeParse(boardId);
  if (!id.success) return NOT_FOUND;
  const parsed = boardDetailsSchema.safeParse(input);
  if (!parsed.success) return fieldErrorResult(parsed.error);

  if (!(await boards.updateBoardDetails(user.id, id.data, parsed.data)))
    return NOT_FOUND;
  refresh();
  return { ok: true, data: undefined };
}

export async function updateBoardAppearanceAction(
  boardId: unknown,
  input: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const id = idSchema.safeParse(boardId);
  if (!id.success) return NOT_FOUND;
  const parsed = boardAppearanceSchema.safeParse(input);
  if (!parsed.success) return fieldErrorResult(parsed.error);

  if (!(await boards.updateBoardAppearance(user.id, id.data, parsed.data)))
    return NOT_FOUND;
  refresh();
  return { ok: true, data: undefined };
}

export async function setBoardOpenAction(
  boardId: unknown,
  open: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const id = idSchema.safeParse(boardId);
  const isOpen = z.boolean().safeParse(open);
  if (!id.success || !isOpen.success) return NOT_FOUND;

  if (!(await boards.setBoardStatus(user.id, id.data, isOpen.data)))
    return NOT_FOUND;
  refresh();
  return { ok: true, data: undefined };
}

export async function regenerateLinkAction(
  boardId: unknown,
  link: unknown,
): Promise<ActionResult> {
  const user = await requireUser();
  const id = idSchema.safeParse(boardId);
  const which = z.enum(["share", "reveal"]).safeParse(link);
  if (!id.success || !which.success) return NOT_FOUND;

  if (!(await boards.regenerateSlug(user.id, id.data, which.data)))
    return NOT_FOUND;
  refresh();
  return { ok: true, data: undefined };
}

export async function deleteBoardAction(
  boardId: unknown,
): Promise<ActionResult<never>> {
  const user = await requireUser();
  const id = idSchema.safeParse(boardId);
  if (!id.success) return NOT_FOUND;

  if (!(await boards.deleteBoard(user.id, id.data))) return NOT_FOUND;
  redirect("/dashboard?deleted=1");
}
