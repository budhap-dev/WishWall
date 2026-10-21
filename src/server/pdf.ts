import "server-only";
import { copyFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Browser } from "playwright-core";

export type PaperSize = "a4" | "letter";

// Serverless Chromium ships one font (Open Sans) and no emoji, so this one is
// bundled with the function (next.config.ts) and installed before launch.
const EMOJI_FONT = join(process.cwd(), "src/server/fonts/NotoColorEmoji.ttf");

/**
 * Headless Chromium for PDF rendering. On Vercel it's @sparticuz/chromium (a
 * build small enough for a serverless function); everywhere else it's the
 * browser Playwright installs (`pnpm exec playwright install chromium`).
 */
async function launchBrowser(): Promise<Browser> {
  const { chromium: playwright } = await import("playwright-core");
  if (!process.env.VERCEL) return playwright.launch();

  const { default: chromium } = await import("@sparticuz/chromium");
  // Unpacks Chromium, and its fonts into /tmp/fonts (where fontconfig looks).
  const executablePath = await chromium.executablePath();
  const fontDir = join(tmpdir(), "fonts");
  await mkdir(fontDir, { recursive: true });
  await copyFile(EMOJI_FONT, join(fontDir, "NotoColorEmoji.ttf"));
  return playwright.launch({ args: chromium.args, executablePath });
}

/**
 * Loads `url` (a board's print page) and prints it to PDF. Waits for every
 * image and web font so nothing renders blank or in a fallback face.
 */
export async function renderPdf(
  url: string,
  paper: PaperSize,
): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: 30_000,
    });
    if (!response?.ok()) {
      throw new Error(`Print page returned ${response?.status() ?? "nothing"}`);
    }
    // Streamed content is swapped in by script, possibly after `load`.
    await page.waitForSelector("[data-print-ready]");
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images, (img) =>
          img.complete ? null : img.decode().catch(() => null),
        ),
      );
    });
    return await page.pdf({
      format: paper === "letter" ? "Letter" : "A4",
      printBackground: true,
      // Margins come from the print page's @page rule.
      preferCSSPageSize: false,
    });
  } finally {
    await browser.close();
  }
}
