import { AA_CONTRAST, contrastRatio } from "@/lib/color";
import type { FontKey } from "@/templates/fonts";
import {
  CARD_COLOR_KEYS,
  type CardColorKey,
  type TemplateConfig,
} from "@/templates/types";

/**
 * Per-message font and text colour that contributors can choose. Stored as
 * these short ids (not font names or hex), so the look can be tuned later
 * without touching data. `null` means "use the template's".
 */

export const MESSAGE_FONTS = {
  handwritten: { label: "Handwritten", font: "caveat", scale: 1.3 },
  marker: { label: "Marker", font: "patrickHand", scale: 1.12 },
  script: { label: "Script", font: "dancing", scale: 1.22 },
  serif: { label: "Serif", font: "lora", scale: 1 },
  rounded: { label: "Rounded", font: "nunito", scale: 1 },
  playful: { label: "Playful", font: "baloo", scale: 1.05 },
} as const satisfies Record<
  string,
  { label: string; font: FontKey; scale: number }
>;

export type MessageFontId = keyof typeof MESSAGE_FONTS;
export const MESSAGE_FONT_IDS = Object.keys(MESSAGE_FONTS) as MessageFontId[];

export const TEXT_COLORS = {
  black: { label: "Black", hex: "#1c1917" },
  white: { label: "White", hex: "#ffffff" },
  red: { label: "Red", hex: "#b91c1c" },
  blue: { label: "Blue", hex: "#1d4ed8" },
  green: { label: "Green", hex: "#166534" },
  purple: { label: "Purple", hex: "#7e22ce" },
} as const satisfies Record<string, { label: string; hex: string }>;

export type TextColorId = keyof typeof TEXT_COLORS;
export const TEXT_COLOR_IDS = Object.keys(TEXT_COLORS) as TextColorId[];

export function isFontId(
  value: string | null | undefined,
): value is MessageFontId {
  return value != null && value in MESSAGE_FONTS;
}

export function isTextColorId(
  value: string | null | undefined,
): value is TextColorId {
  return value != null && value in TEXT_COLORS;
}

/** Whether a text colour is readable (WCAG AA) on the given card colour. */
export function isTextColorReadable(
  template: TemplateConfig,
  cardColor: string | null | undefined,
  textColor: TextColorId,
): boolean {
  const key = (CARD_COLOR_KEYS as readonly string[]).includes(cardColor ?? "")
    ? (cardColor as CardColorKey)
    : template.cards.defaultColor;
  const background = template.cards.palette[key].background;
  return contrastRatio(TEXT_COLORS[textColor].hex, background) >= AA_CONTRAST;
}
