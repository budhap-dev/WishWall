import type { NextConfig } from "next";

const noIndex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // The PDF route reads these files at runtime by path, which tracing can't
  // see: Playwright's browser registry, serverless Chromium's compressed
  // binaries and the emoji font.
  outputFileTracingIncludes: {
    "/board/\\[slug\\]/pdf": [
      "./node_modules/playwright-core/browsers.json",
      "./node_modules/@sparticuz/chromium/bin/**",
      "./src/server/fonts/**",
    ],
  },
  // Keep boards out of search engines even if a link gets posted publicly.
  async headers() {
    return [
      { source: "/board/:path*", headers: noIndex },
      { source: "/dashboard/:path*", headers: noIndex },
      { source: "/api/:path*", headers: noIndex },
    ];
  },
};

export default nextConfig;
