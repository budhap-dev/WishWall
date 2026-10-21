import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { isValidSlug } from "@/lib/slug";
import { clientIpKey } from "@/server/client-ip";
import { renderPdf } from "@/server/pdf";
import { consumeRateLimit, retryAfterText } from "@/server/rate-limit";
import { getBoardByRevealSlug } from "@/server/services/boards";

// Cold-starting Chromium on a serverless function takes a few seconds.
export const maxDuration = 60;

/**
 * GET /board/<revealSlug>/pdf?paper=a4|letter
 *
 * Renders the board's print page (./print) in headless Chromium and returns
 * it as a PDF download. Keyed by the reveal slug: it's the finished board, so
 * contributors' share links can't fetch it (surprise mode stays a surprise).
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/board/[slug]/pdf">,
) {
  const fail = (status: number, error: string) =>
    Response.json({ error }, { status });

  const { slug } = await ctx.params;
  const board = isValidSlug(slug) ? await getBoardByRevealSlug(slug) : null;
  if (!board) return fail(404, "This card doesn't exist.");

  const limit = await consumeRateLimit(
    `pdf:ip:${clientIpKey(request.headers)}`,
    env.RATE_LIMIT_PDF_PER_IP,
    3600,
  );
  if (!limit.ok) {
    return fail(
      429,
      `Too many downloads. Try again in ${retryAfterText(limit.resetAt)}.`,
    );
  }

  const paper =
    request.nextUrl.searchParams.get("paper") === "letter" ? "letter" : "a4";
  // APP_URL rather than the request's Host header, so the browser can only
  // ever be pointed at this app.
  const printUrl = `${env.APP_URL.replace(/\/$/, "")}/board/${slug}/print`;

  let pdf: Buffer;
  try {
    pdf = await renderPdf(printUrl, paper);
  } catch (error) {
    console.error("PDF rendering failed", slug, error);
    return fail(503, "Couldn't create the PDF. Please try again.");
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": attachment(board.title),
      "Cache-Control": "private, no-store",
    },
  });
}

/** Content-Disposition naming the file after the board, with an ASCII fallback. */
function attachment(title: string): string {
  const ascii = title.replace(/[^\x20-\x7e]|["\\]/g, "").trim() || "card";
  return `attachment; filename="${ascii}.pdf"; filename*=UTF-8''${encodeURIComponent(`${title}.pdf`)}`;
}
