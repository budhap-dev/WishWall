import sharp from "sharp";
import { describe, expect, it } from "vitest";
import {
  ImageRejectedError,
  processImage,
  sniffImageType,
} from "@/server/images";
import { signUpload, verifyUpload } from "@/server/upload-token";

const solid = (
  format: "png" | "jpeg" | "webp" | "gif",
  width = 64,
  height = 48,
) =>
  sharp({ create: { width, height, channels: 3, background: "#60a5fa" } })
    .toFormat(format)
    .toBuffer();

describe("sniffImageType", () => {
  it.each(["png", "jpeg", "webp", "gif"] as const)(
    "recognises %s by its bytes",
    async (format) => {
      expect(sniffImageType(await solid(format))).toBe(format);
    },
  );

  it("rejects non-images regardless of what they claim to be", () => {
    expect(sniffImageType(Buffer.from("<svg onload=alert(1)>"))).toBeNull();
    expect(sniffImageType(Buffer.from("%PDF-1.7"))).toBeNull();
    expect(sniffImageType(Buffer.alloc(0))).toBeNull();
  });
});

describe("processImage", () => {
  it("re-encodes photos to WebP and strips EXIF (e.g. GPS location)", async () => {
    const withExif = await sharp(await solid("jpeg"))
      .withExif({ IFD0: { Copyright: "secret", Artist: "Someone" } })
      .jpeg()
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const out = await processImage(withExif);
    expect(out).toMatchObject({
      ext: "webp",
      contentType: "image/webp",
      width: 64,
      height: 48,
    });
    expect((await sharp(out.body).metadata()).exif).toBeUndefined();
  });

  it("shrinks large photos to at most 2000px", async () => {
    const out = await processImage(await solid("png", 4000, 1000));
    expect([out.width, out.height]).toEqual([2000, 500]);
  });

  it("keeps GIFs as they are (so they stay animated)", async () => {
    const gif = await solid("gif", 120, 80);
    const out = await processImage(gif);
    expect(out).toMatchObject({ ext: "gif", width: 120, height: 80 });
    expect(out.body.equals(gif)).toBe(true);
  });

  it("rejects corrupt images and oversized GIFs", async () => {
    const truncated = (await solid("png")).subarray(0, 40);
    await expect(processImage(truncated)).rejects.toBeInstanceOf(
      ImageRejectedError,
    );
    await expect(processImage(await solid("gif", 1500, 100))).rejects.toThrow(
      /at most 1200px/,
    );
    await expect(processImage(Buffer.from("not an image"))).rejects.toThrow(
      /Only JPEG, PNG/,
    );
  });
});

describe("upload tokens", () => {
  const image = {
    key: "messages/2026/AAAAAAAAAAAAAAAAAAAAAA.webp",
    width: 800,
    height: 600,
  };

  it("verifies an unmodified upload", () => {
    expect(verifyUpload(image, signUpload(image))).toBe(true);
  });

  it("rejects a different key or tampered dimensions", () => {
    const token = signUpload(image);
    expect(
      verifyUpload(
        { ...image, key: "messages/2026/BBBBBBBBBBBBBBBBBBBBBB.webp" },
        token,
      ),
    ).toBe(false);
    expect(verifyUpload({ ...image, width: 8000 }, token)).toBe(false);
    expect(verifyUpload(image, "")).toBe(false);
    expect(verifyUpload(image, "not-a-real-token")).toBe(false);
  });
});
