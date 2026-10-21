import type { CSSProperties } from "react";
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
