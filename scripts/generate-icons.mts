/**
 * Draws the app icons (a white heart on the brand red) for installing
 * WishWall to a phone's home screen. Run after changing the design:
 *
 *   pnpm exec tsx scripts/generate-icons.mts
 *
 * Outputs are committed; nothing runs this at build time.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BRAND_RED } from "../src/lib/brand";
const HEART =
  "M50 82 C20 62 12 46 12 34 C12 22 22 14 32 14 C40 14 46 18 50 25 C54 18 60 14 68 14 C78 14 88 22 88 34 C88 46 80 62 50 82 Z";

/**
 * `rounded`: transparent corners, for launchers that show the icon as is.
 * Otherwise the red fills the square and the heart sits inside the central
 * 80% "safe zone", for Android's masked icons and iOS (which rounds it).
 */
function iconSvg(rounded: boolean): string {
  const heartScale = rounded ? 0.62 : 0.5;
  const offset = (100 - 100 * heartScale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="${rounded ? 22 : 0}" fill="${BRAND_RED}"/>
  <g transform="translate(${offset} ${offset + 2}) scale(${heartScale})">
    <path d="${HEART}" fill="#ffffff"/>
  </g>
</svg>`;
}

async function render(file: string, size: number, rounded: boolean) {
  const png = await sharp(Buffer.from(iconSvg(rounded)))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, png);
  console.log(`${file} (${size}×${size})`);
}

const root = path.join(import.meta.dirname, "..");
await render(path.join(root, "public/icons/icon-192.png"), 192, true);
await render(path.join(root, "public/icons/icon-512.png"), 512, true);
await render(path.join(root, "public/icons/icon-maskable-512.png"), 512, false);
// Next.js turns app/apple-icon.png into the apple-touch-icon link.
await render(path.join(root, "src/app/apple-icon.png"), 180, false);
