import "server-only";
import sharp from "sharp";
import type { ImageExtension } from "./storage/types";

export type ProcessedImage = {
  body: Buffer;
  contentType: string;
  ext: ImageExtension;
  width: number;
  height: number;
};

export class ImageRejectedError extends Error {}

type SniffedType = "jpeg" | "png" | "webp" | "gif";

/**
 * Identify an image by its first bytes ("magic numbers"), ignoring whatever
 * the browser claimed the type was. Anything we don't recognise is rejected.
 */
export function sniffImageType(bytes: Uint8Array): SniffedType | null {
  const ascii = (start: number, end: number) =>
    String.fromCharCode(...bytes.subarray(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "jpeg";
  if (ascii(0, 8) === "\x89PNG\r\n\x1a\n") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "gif";
  return null;
}

const MAX_DIMENSION = 2000; // longest edge after resizing photos
const MAX_GIF_DIMENSION = 1200;
const MAX_GIF_FRAMES = 300;
const MAX_INPUT_PIXELS = 60_000_000; // guards against decompression bombs

/**
 * Validates and normalises an upload:
 * - photos (JPEG/PNG/WebP) are decoded, auto-rotated, shrunk to ≤2000px and
 *   re-encoded as WebP. Re-encoding drops all metadata, including EXIF GPS
 *   location from phone photos, and anything smuggled after the image data.
 * - GIFs are kept as-is so they stay animated, after checking they decode
 *   and aren't absurdly large.
 */
export async function processImage(bytes: Buffer): Promise<ProcessedImage> {
  const type = sniffImageType(bytes);
  if (!type)
    throw new ImageRejectedError(
      "Only JPEG, PNG, WebP and GIF images are allowed.",
    );

  try {
    if (type === "gif") {
      const meta = await sharp(bytes, {
        animated: true,
        limitInputPixels: MAX_INPUT_PIXELS,
      }).metadata();
      const width = meta.width ?? 0;
      const height = meta.pageHeight ?? meta.height ?? 0;
      if (!width || !height)
        throw new ImageRejectedError("That GIF couldn't be read.");
      if (width > MAX_GIF_DIMENSION || height > MAX_GIF_DIMENSION) {
        throw new ImageRejectedError(
          `GIFs can be at most ${MAX_GIF_DIMENSION}px on each side.`,
        );
      }
      if ((meta.pages ?? 1) > MAX_GIF_FRAMES) {
        throw new ImageRejectedError("That GIF has too many frames.");
      }
      return {
        body: bytes,
        contentType: "image/gif",
        ext: "gif",
        width,
        height,
      };
    }

    const { data, info } = await sharp(bytes, {
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate() // apply EXIF orientation before metadata is dropped
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return {
      body: data,
      contentType: "image/webp",
      ext: "webp",
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    if (error instanceof ImageRejectedError) throw error;
    throw new ImageRejectedError(
      "That image couldn't be read. Try a different file.",
    );
  }
}
