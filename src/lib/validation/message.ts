import { z } from "zod";
import { MESSAGE_FONT_IDS, TEXT_COLOR_IDS } from "@/lib/message-style";
import { CARD_COLOR_KEYS } from "@/templates/types";
import { multiLine, singleLine } from "./common";

export const MESSAGE_LIMITS = {
  authorName: 60,
  body: 1000,
  imageAlt: 200,
} as const;

/** An image uploaded via /api/uploads, with the signature it was issued. */
export const uploadedImageSchema = z.object({
  key: z.string().max(200),
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
  token: z.string().max(100),
});

const imageWithAlt = uploadedImageSchema.extend({
  alt: z
    .string()
    .max(MESSAGE_LIMITS.imageAlt)
    .transform((s) => s.replace(/\s+/g, " ").trim()),
});

export const messageContentSchema = z
  .object({
    authorName: singleLine(MESSAGE_LIMITS.authorName, "Your name"),
    body: multiLine(MESSAGE_LIMITS.body, "Message"),
    cardColor: z.enum(CARD_COLOR_KEYS),
    /** null = the template's font / text colour. */
    font: z.enum(MESSAGE_FONT_IDS).nullable().default(null),
    textColor: z.enum(TEXT_COLOR_IDS).nullable().default(null),
    /** null removes an existing image when editing. */
    image: imageWithAlt.nullable(),
  })
  .refine((m) => m.body !== null || m.image !== null, {
    message: "Write a message or add a photo",
    path: ["body"],
  });

export const createMessageSchema = messageContentSchema.and(
  z.object({ captchaToken: z.string().max(2048).optional() }),
);

/** Proof of authorship for guests: the raw token stored in their browser. */
export const editTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32}$/);

export type MessageContentInput = z.input<typeof messageContentSchema>;
export type MessageContentData = z.output<typeof messageContentSchema>;
export type UploadedImageInput = z.input<typeof uploadedImageSchema>;
