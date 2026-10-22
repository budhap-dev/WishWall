import { describe, expect, it } from "vitest";
import {
  COLUMN_WIDTH,
  CONTENT_WIDTH,
  contentHeight,
  GAP,
  layoutPages,
  PAGE_HEIGHT,
  parsePaper,
  PRINT_ZOOM,
} from "@/lib/print-layout";

const H = 1000;
const card = (id: string, height: number, fullHeight = height / 2) => ({
  id,
  height,
  fullHeight,
});

describe("layoutPages", () => {
  it("fills the shortest column first, in order", () => {
    const pages = layoutPages(
      [card("a", 300), card("b", 100), card("c", 200), card("d", 50)],
      H,
    );
    expect(pages).toHaveLength(1);
    expect(pages[0].map((p) => [p.id, p.x, p.y])).toEqual([
      ["a", 0, 0],
      ["b", COLUMN_WIDTH + GAP, 0],
      ["c", 2 * (COLUMN_WIDTH + GAP), 0],
      // Column b is the shortest now.
      ["d", COLUMN_WIDTH + GAP, 100 + GAP],
    ]);
  });

  it("starts a new page when the card doesn't fit", () => {
    const pages = layoutPages(
      [card("a", 900), card("b", 900), card("c", 900), card("d", 200)],
      H,
    );
    expect(pages.map((page) => page.map((p) => p.id))).toEqual([
      ["a", "b", "c"],
      ["d"],
    ]);
    expect(pages[1][0]).toMatchObject({ x: 0, y: 0 });
  });

  it("spreads a card taller than a page across the full width", () => {
    const pages = layoutPages([card("a", 100), card("long", 1500, 600)], H);
    expect(pages).toHaveLength(1);
    expect(pages[0][1]).toEqual({
      id: "long",
      x: 0,
      y: 100 + GAP,
      width: CONTENT_WIDTH,
      scale: 1,
    });
  });

  it("puts a full-width card on a new page if it doesn't fit below the others", () => {
    const pages = layoutPages([card("a", 600), card("long", 1500, 800)], H);
    expect(pages.map((page) => page.map((p) => p.id))).toEqual([
      ["a"],
      ["long"],
    ]);
    expect(pages[1][0].y).toBe(0);
  });

  it("shrinks a card too tall even at full width, centred", () => {
    const [[placed]] = layoutPages([card("huge", 4000, 2000)], H);
    expect(placed.scale).toBe(0.5);
    expect(placed.x).toBe(CONTENT_WIDTH / 4);
  });

  it("returns no pages for no cards", () => {
    expect(layoutPages([], H)).toEqual([]);
  });
});

describe("paper", () => {
  it("never makes a page taller than the sheet once zoomed", () => {
    // 96 CSS px per inch: A4 is 297 mm tall, Letter 11 in.
    expect(PAGE_HEIGHT.a4 * PRINT_ZOOM.a4).toBeLessThanOrEqual(
      (297 / 25.4) * 96,
    );
    expect(PAGE_HEIGHT.letter * PRINT_ZOOM.letter).toBeLessThanOrEqual(11 * 96);
    expect(contentHeight("a4")).toBeGreaterThan(contentHeight("letter"));
  });

  it("reads the query value, defaulting to A4", () => {
    expect(parsePaper("letter")).toBe("letter");
    expect(parsePaper("a4")).toBe("a4");
    expect(parsePaper(null)).toBe("a4");
    expect(parsePaper(["letter"])).toBe("a4");
  });
});
