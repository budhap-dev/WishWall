import { z } from "zod";
import { Occasion } from "@/generated/prisma/enums";
import { isTemplateForOccasion } from "@/templates";
import { multiLine, optionalDate, singleLine } from "./common";
import { uploadedImageSchema } from "./message";

export const BOARD_LIMITS = {
  recipientName: 80,
  title: 120,
  intro: 1000,
} as const;

export const occasionSchema = z.enum(Occasion);

const recipientName = singleLine(BOARD_LIMITS.recipientName, "Recipient name");
const title = singleLine(BOARD_LIMITS.title, "Title");
const intro = multiLine(BOARD_LIMITS.intro, "Intro message");

/** Template must exist and belong to the chosen occasion. */
const appearanceShape = {
  occasion: occasionSchema,
  templateId: z.string().max(64),
};

function templateMatchesOccasion(v: {
  occasion: Occasion;
  templateId: string;
}) {
  return isTemplateForOccasion(v.templateId, v.occasion);
}

const templateError = {
  message: "Pick a template for this occasion",
  path: ["templateId"],
};

export const boardDetailsSchema = z.object({
  recipientName,
  title,
  intro,
  eventDate: optionalDate,
  allowGuests: z.boolean(),
  messagesVisible: z.boolean(),
});

export const createBoardSchema = boardDetailsSchema
  .extend(appearanceShape)
  .extend({ recipientPhoto: uploadedImageSchema.nullable().default(null) })
  .refine(templateMatchesOccasion, templateError);

export const boardAppearanceSchema = z
  .object(appearanceShape)
  .refine(templateMatchesOccasion, templateError);

/** What the wizard/forms send (pre-transform). */
export type CreateBoardInput = z.input<typeof createBoardSchema>;
export type CreateBoardData = z.output<typeof createBoardSchema>;
export type BoardDetailsInput = z.input<typeof boardDetailsSchema>;
export type BoardDetailsData = z.output<typeof boardDetailsSchema>;
export type BoardAppearanceData = z.output<typeof boardAppearanceSchema>;
