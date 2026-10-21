import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { Occasion } from "@/generated/prisma/enums";
import { CARD_COLOR_KEYS, TEMPLATES, templatesFor } from "@/templates";

// WCAG 2.x relative luminance / contrast ratio for #rrggbb colours.
function luminance(hex: string): number {
  const channels = hex
    .replace("#", "")
    .match(/../g)!
    .map((c) => parseInt(c, 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const [r, g, b] = channels as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}

const HEX = /^#[0-9a-f]{6}$/i;

describe("template registry", () => {
  it("registers every config file", () => {
    const dir = path.join(__dirname, "../../src/templates/configs");
    const fileIds = readdirSync(dir)
      .filter((f) => f.endsWith(".ts"))
      .map((f) => f.replace(/\.ts$/, ""))
      .sort();
    expect(TEMPLATES.map((t) => t.id).sort()).toEqual(fileIds);
  });

  it("has unique ids", () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(Object.values(Occasion))(
    "has at least 2 templates for %s",
    (occasion) => {
      expect(templatesFor(occasion).length).toBeGreaterThanOrEqual(2);
    },
  );
});

describe.each(TEMPLATES.map((t) => [t.id, t] as const))(
  "template %s",
  (_id, t) => {
    it("defines every card colour slot", () => {
      expect(Object.keys(t.cards.palette).sort()).toEqual(
        [...CARD_COLOR_KEYS].sort(),
      );
      expect(CARD_COLOR_KEYS).toContain(t.cards.defaultColor);
    });

    it("uses #rrggbb colours", () => {
      const { background, heading, text, accent, accentText } = t.colors;
      for (const c of [background, heading, text, accent, accentText])
        expect(c).toMatch(HEX);
      for (const card of Object.values(t.cards.palette)) {
        expect(card.background).toMatch(HEX);
        expect(card.text).toMatch(HEX);
      }
    });

    it("meets WCAG AA contrast", () => {
      // Body text needs 4.5:1; the board title is large text, so 3:1.
      expect(
        contrast(t.colors.text, t.colors.background),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrast(t.colors.heading, t.colors.background),
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(t.colors.accentText, t.colors.accent),
      ).toBeGreaterThanOrEqual(4.5);
      for (const [key, card] of Object.entries(t.cards.palette)) {
        expect(
          contrast(card.text, card.background),
          `card ${key}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    });
  },
);
