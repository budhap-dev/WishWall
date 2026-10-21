import "server-only";
import { randomBytes } from "node:crypto";
import { env } from "@/lib/env";
import { createCloudinaryStorage } from "./cloudinary";
import { createLocalStorage } from "./local";
import type { ImageExtension, ImagePurpose, StorageAdapter } from "./types";

export * from "./types";

/** Whether photo/GIF uploads are switched on (UPLOADS_ENABLED). */
export const uploadsEnabled = env.UPLOADS_ENABLED;

export const localDisk = createLocalStorage(env.LOCAL_UPLOAD_DIR);

export const storage: StorageAdapter =
  env.STORAGE_DRIVER === "cloudinary"
    ? createCloudinaryStorage({
        // env.ts guarantees these are set when the driver is "cloudinary".
        cloudName: env.CLOUDINARY_CLOUD_NAME!,
        apiKey: env.CLOUDINARY_API_KEY!,
        apiSecret: env.CLOUDINARY_API_SECRET!,
        folder: env.CLOUDINARY_FOLDER,
      })
    : localDisk;

export function newStorageKey(
  purpose: ImagePurpose,
  ext: ImageExtension,
): string {
  // 16 random bytes → 22 base64url chars; unguessable and collision-free.
  return `${purpose}/${new Date().getUTCFullYear()}/${randomBytes(16).toString("base64url")}.${ext}`;
}

/** URL for a stored key, or null for none. */
export function imageUrl(key: string | null | undefined): string | null {
  return key ? storage.url(key) : null;
}

/** Deletes keys without failing the caller (orphaned files are harmless). */
export async function deleteImages(
  keys: (string | null | undefined)[],
): Promise<void> {
  await Promise.all(
    keys
      .filter((k): k is string => Boolean(k))
      .map((key) =>
        storage
          .delete(key)
          .catch((error) =>
            console.error("Failed to delete image", key, error),
          ),
      ),
  );
}
