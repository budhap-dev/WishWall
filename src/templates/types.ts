import type { Occasion } from "@/generated/prisma/enums";
import type { FontKey } from "./fonts";

/**
 * Card colours are fixed slots rather than named hues, so a message keeps a
 * sensible colour when the owner switches template: slot "c3" in one template
 * maps to slot "c3" in the next. Every template defines all six.
 */
export const CARD_COLOR_KEYS = ["c1", "c2", "c3", "c4", "c5", "c6"] as const;
export type CardColorKey = (typeof CARD_COLOR_KEYS)[number];

export type CardColor = {
  /** Shown in the colour picker, e.g. "Butter". */
  label: string;
  background: string;
  /** Must meet WCAG AA (4.5:1) against `background`; checked in tests. */
  text: string;
};

/** How a message card is drawn. */
export type CardStyle =
  | "paper" // flat sheet with a soft shadow
  | "polaroid" // white frame, thicker bottom edge
  | "sticky" // sticky note, slightly rotated
  | "glass" // translucent over the background
  | "outline"; // thin border, no fill shadow

/** Ambient decoration layer (rendered in the reveal view, Phase 4). */
export type Decoration =
  | "confetti"
  | "balloons"
  | "hearts"
  | "leaves"
  | "stars"
  | "sparkles"
  | "petals"
  | "bubbles"
  | "streamers"
  | "planes"
  | "none";

/** How cards animate in (Phase 4). */
export type Entrance = "fade-up" | "pop" | "drop" | "flip" | "float";

/** Opening animation of the reveal view (Phase 4). */
export type Opener = "envelope" | "gift-box" | "curtain";

export type TemplateConfig = {
  /** Stable id stored on boards. Never rename once boards use it. */
  id: string;
  name: string;
  occasion: Occasion;
  description: string;
  fonts: { heading: FontKey; body: FontKey };
  colors: {
    background: string;
    /** Optional CSS background-image layered over `background` (gradients, patterns). */
    backgroundImage?: string;
    /** CSS background-size for `backgroundImage`, needed for repeating patterns. */
    backgroundSize?: string;
    /** Board title and other text drawn directly on the background. */
    heading: string;
    text: string;
    /** Buttons/highlights, with `accentText` drawn on top of it. */
    accent: string;
    accentText: string;
  };
  cards: {
    style: CardStyle;
    /** Corner radius in px. */
    radius: number;
    palette: Record<CardColorKey, CardColor>;
    defaultColor: CardColorKey;
  };
  decoration: Decoration;
  entrance: Entrance;
  opener: Opener;
};

/** Identity helper that type-checks a template config file. */
export function defineTemplate(config: TemplateConfig): TemplateConfig {
  return config;
}
