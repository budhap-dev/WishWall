export type PaperSize = "a4" | "letter";

/**
 * Printed pages are laid out at a fixed design width and zoomed to the paper
 * (and to the screen in the preview), so the layout is identical everywhere.
 */
export const PAGE_WIDTH = 1000;

/** Page height at the design width: the paper's aspect ratio, rounded down so a page never spills onto the next sheet. */
export const PAGE_HEIGHT: Record<PaperSize, number> = {
  a4: Math.floor((PAGE_WIDTH * 297) / 210),
  letter: Math.floor((PAGE_WIDTH * 11) / 8.5),
};

/** CSS zoom from the design width to the paper's width at 96 CSS px per inch. */
export const PRINT_ZOOM: Record<PaperSize, number> = {
  a4: (210 / 25.4) * (96 / PAGE_WIDTH),
  letter: 8.5 * (96 / PAGE_WIDTH),
};

/** Sent to the parent window (the download preview) once the pages are laid out. */
export const PAGES_MESSAGE = "wishwall:print-pages";

export const PAGE_PADDING = { top: 64, side: 64, bottom: 88 };
export const COLUMNS = 3;
export const GAP = 24;
export const CONTENT_WIDTH = PAGE_WIDTH - 2 * PAGE_PADDING.side;
export const COLUMN_WIDTH = (CONTENT_WIDTH - (COLUMNS - 1) * GAP) / COLUMNS;

export function contentHeight(paper: PaperSize): number {
  return PAGE_HEIGHT[paper] - PAGE_PADDING.top - PAGE_PADDING.bottom;
}

/** A card's measured height in one column, and across the full page width. */
export type MeasuredCard = { id: string; height: number; fullHeight: number };

/** Where a card goes on its page, relative to the page's content area. */
export type Placement = {
  id: string;
  x: number;
  y: number;
  width: number;
  /** Below 1 only for a card too tall for a page even at full width. */
  scale: number;
};

/**
 * Packs cards onto pages in order, masonry style: each goes to the shortest
 * column, or onto a new page if it doesn't fit there. A card taller than a
 * page spans every column instead (a long letter reads better wide), and is
 * shrunk only if it still doesn't fit.
 */
export function layoutPages(
  cards: MeasuredCard[],
  maxHeight: number,
): Placement[][] {
  const pages: Placement[][] = [];
  let page: Placement[] = [];
  // Where the next card in each column would start.
  let tops: number[] = Array(COLUMNS).fill(0);
  const newPage = () => {
    if (page.length > 0) pages.push(page);
    page = [];
    tops = Array(COLUMNS).fill(0);
  };

  for (const card of cards) {
    if (card.height <= maxHeight) {
      let column = tops.indexOf(Math.min(...tops));
      if (tops[column] + card.height > maxHeight) {
        newPage();
        column = 0;
      }
      page.push({
        id: card.id,
        x: column * (COLUMN_WIDTH + GAP),
        y: tops[column],
        width: COLUMN_WIDTH,
        scale: 1,
      });
      tops[column] += card.height + GAP;
    } else {
      const scale = Math.min(1, maxHeight / card.fullHeight);
      const height = card.fullHeight * scale;
      if (Math.max(...tops) + height > maxHeight) newPage();
      const y = Math.max(...tops);
      page.push({
        id: card.id,
        x: (CONTENT_WIDTH * (1 - scale)) / 2,
        y,
        width: CONTENT_WIDTH,
        scale,
      });
      tops = tops.map(() => y + height + GAP);
    }
  }
  newPage();
  return pages;
}

/** The `?paper=` query value: US Letter if asked for, A4 otherwise. */
export function parsePaper(
  value: string | string[] | null | undefined,
): PaperSize {
  return value === "letter" ? "letter" : "a4";
}
