import "server-only";
import type { UploadedImageInput } from "@/lib/validation/message";
import {
  type ImagePurpose,
  isStorageKey,
  uploadsEnabled,
} from "@/server/storage";
import { verifyUpload } from "@/server/upload-token";

/** True if `image` came from our upload route for this purpose, unmodified. */
export function isVerifiedUpload(
  image: UploadedImageInput,
  purpose: ImagePurpose,
): boolean {
  return (
    uploadsEnabled &&
    isStorageKey(image.key) &&
    image.key.startsWith(`${purpose}/`) &&
    verifyUpload(
      { key: image.key, width: image.width, height: image.height },
      image.token,
    )
  );
}
