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

/**
 * Classes giving each card style its look. Every card is a "sheet" with a
 * layered, realistic shadow; all but glass get a paper texture (globals.css).
 */
export const CARD_STYLE_CLASSES: Record<CardStyle, string> = {
  paper: "ww-sheet ww-paper",
  polaroid: "ww-sheet ww-paper border-[10px] border-b-[28px] border-white",
  sticky: "ww-sheet ww-paper",
  glass: "ww-sheet bg-clip-padding opacity-95 ring-1 ring-white/30",
  outline: "ww-sheet ww-paper border-2 border-current",
};

/** Max tilt (degrees) per style: sticky notes get slapped on, letters are placed. */
const MAX_TILT: Record<CardStyle, number> = {
  sticky: 2.4,
  polaroid: 1.8,
  paper: 1.2,
  outline: 0.8,
  glass: 0.6,
};

/**
 * A small, stable rotation for a card, as if placed by hand. Derived from
 * the message id so it's the same on every render (no hydration mismatch).
 */
export function cardTilt(t: TemplateConfig, seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const unit = ((hash >>> 0) % 1000) / 999; // 0..1
  return Math.round((unit * 2 - 1) * MAX_TILT[t.cards.style] * 10) / 10;
}

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
