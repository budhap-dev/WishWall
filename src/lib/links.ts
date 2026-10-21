import "server-only";
import { env } from "@/lib/env";

/** Absolute URLs for a board's public links, built from APP_URL. */
export function boardLinks(board: { shareSlug: string; revealSlug: string }) {
  const base = env.APP_URL.replace(/\/$/, "");
  return {
    contribute: `${base}/board/${board.shareSlug}`,
    reveal: `${base}/board/${board.revealSlug}/reveal`,
  };
}
