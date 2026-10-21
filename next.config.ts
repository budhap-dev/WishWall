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
