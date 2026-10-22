/**
 * Draws the app icons (a white heart on the brand red) for installing
 * WishWall to a phone's home screen, and the browser tab's favicon. The site
 * header draws the same mark (src/components/site/logo.tsx). Run after
 * changing the design:
 *
 *   pnpm exec tsx scripts/generate-icons.mts
 *
 * Outputs are committed; nothing runs this at build time.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { BRAND_RED, HEART_PATH } from "../src/lib/brand";

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
    <path d="${HEART_PATH}" fill="#ffffff"/>
  </g>
</svg>`;
}

function toPng(size: number, rounded: boolean): Promise<Buffer> {
  return sharp(Buffer.from(iconSvg(rounded)))
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function render(file: string, size: number, rounded: boolean) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, await toPng(size, rounded));
  console.log(`${file} (${size}×${size})`);
}

/** An .ico holding one PNG per size (every current browser reads these). */
async function renderIco(file: string, sizes: number[]) {
  const pngs = await Promise.all(sizes.map((size) => toPng(size, true)));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((size, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry); // width
    header.writeUInt8(size, entry + 1); // height
    header.writeUInt16LE(1, entry + 4); // colour planes
    header.writeUInt16LE(32, entry + 6); // bits per pixel
    header.writeUInt32LE(pngs[i].length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += pngs[i].length;
  });
  await writeFile(file, Buffer.concat([header, ...pngs]));
  console.log(`${file} (${sizes.join(", ")})`);
}

const root = path.join(import.meta.dirname, "..");
await render(path.join(root, "public/icons/icon-192.png"), 192, true);
await render(path.join(root, "public/icons/icon-512.png"), 512, true);
await render(path.join(root, "public/icons/icon-maskable-512.png"), 512, false);
// Next.js turns app/apple-icon.png into the apple-touch-icon link.
await render(path.join(root, "src/app/apple-icon.png"), 180, false);
// The browser tab: app/favicon.ico for every browser, and app/icon.svg,
// which stays sharp at any size, for browsers that prefer it.
await renderIco(path.join(root, "src/app/favicon.ico"), [16, 32, 48]);
await writeFile(path.join(root, "src/app/icon.svg"), iconSvg(true));
console.log("src/app/icon.svg");
