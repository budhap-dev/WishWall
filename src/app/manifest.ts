import type { MetadataRoute } from "next";
import { BRAND_RED } from "@/lib/brand";

/**
 * Makes WishWall installable to a phone's home screen (Android offers
 * "Install app"; iOS has Share → Add to Home Screen). It opens on the
 * owner's boards; signed-out visitors are sent to sign-in first.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "WishWall",
    short_name: "WishWall",
    description:
      "Group cards for the people you love: create a board, collect everyone's messages, then reveal it.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: BRAND_RED,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
