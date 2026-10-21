import type { CSSProperties } from "react";
import {
  isFontId,
  isTextColorId,
  isTextColorReadable,
  MESSAGE_FONTS,
  TEXT_COLORS,
} from "@/lib/message-style";
import { fontFamily } from "./fonts";
import {
  CARD_COLOR_KEYS,
  type CardColorKey,
  type CardStyle,
  type TemplateConfig,
} from "./types";

/** Inline styles for a surface painted with the template's background. */
export function boardSurfaceStyle(t: TemplateConfig): CSSProperties {
  return {
    backgroundColor: t.colors.background,
    backgroundImage: t.colors.backgroundImage,
    backgroundSize: t.colors.backgroundSize,
    color: t.colors.text,
    fontFamily: fontFamily(t.fonts.body),
  };
}

export function headingStyle(t: TemplateConfig): CSSProperties {
  return { color: t.colors.heading, fontFamily: fontFamily(t.fonts.heading) };
}

/** Picks the stored colour if valid, otherwise the template default. */
export function cardColorKey(
  t: TemplateConfig,
  key: string | null | undefined,
): CardColorKey {
  return (CARD_COLOR_KEYS as readonly string[]).includes(key ?? "")
    ? (key as CardColorKey)
    : t.cards.defaultColor;
}

export function cardStyle(
  t: TemplateConfig,
  key: string | null | undefined,
): CSSProperties {
  const color = t.cards.palette[cardColorKey(t, key)];
  return {
    backgroundColor: color.background,
    color: color.text,
    borderRadius: t.cards.radius,
    fontFamily: fontFamily(t.fonts.body),
  };
}

/** Tailwind classes giving each card style its look. */
export const CARD_STYLE_CLASSES: Record<CardStyle, string> = {
  paper: "shadow-md shadow-black/10",
  polaroid:
    "border-[10px] border-b-[28px] border-white shadow-lg shadow-black/15",
  sticky: "shadow-md shadow-black/15 odd:-rotate-1 even:rotate-1",
  glass:
    "bg-clip-padding opacity-95 shadow-xl shadow-black/30 ring-1 ring-white/30",
  outline: "border-2 border-current",
};

/**
 * Font and colour for a message's own text choices. Falls back to the
 * template's text colour if the chosen one isn't readable on this card (e.g.
 * after the owner switched template).
 */
export function messageTextStyle(
  t: TemplateConfig,
  message: {
    cardColor: string;
    font?: string | null;
    textColor?: string | null;
  },
): CSSProperties {
  const style: CSSProperties = {};
  if (isFontId(message.font)) {
    const choice = MESSAGE_FONTS[message.font];
    style.fontFamily = fontFamily(choice.font);
    style.fontSize = `${choice.scale}em`;
  }
  if (
    isTextColorId(message.textColor) &&
    isTextColorReadable(t, message.cardColor, message.textColor)
  ) {
    style.color = TEXT_COLORS[message.textColor].hex;
  }
  return style;
}
