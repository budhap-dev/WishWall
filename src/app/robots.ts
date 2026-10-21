import type { MetadataRoute } from "next";

// Board and dashboard routes are deliberately NOT disallowed here: a crawler
// that is blocked by robots.txt never fetches the page, so it never sees the
// X-Robots-Tag: noindex header (next.config.ts) and may still index the bare
// URL. Letting it fetch and read "noindex" is what keeps boards out of search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
  };
}
