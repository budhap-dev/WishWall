import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Uploads happen before the message/board is saved, so the client hands the
 * resulting key back to us later. The upload route signs the key and its
 * dimensions; actions verify the signature, so a client can't attach an
 * arbitrary key or lie about an image's size.
 */

export type UploadedImage = { key: string; width: number; height: number };

function mac(image: UploadedImage): Buffer {
  return createHmac("sha256", `upload-token:${env.AUTH_SECRET}`)
    .update(`${image.key}:${image.width}:${image.height}`)
    .digest();
}

export function signUpload(image: UploadedImage): string {
  return mac(image).toString("base64url");
}

export function verifyUpload(image: UploadedImage, token: string): boolean {
  const expected = mac(image);
  const given = Buffer.from(token, "base64url");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
