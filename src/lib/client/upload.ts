"use client";

export type UploadResult = {
  key: string;
  url: string;
  width: number;
  height: number;
  token: string;
};

export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/gif";
// Stay under Vercel's 4.5 MB request limit (server enforces UPLOAD_MAX_BYTES too).
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 2000;

/**
 * Shrinks big photos in the browser before upload: phone photos are often
 * 4–10 MB, over what serverless functions accept. GIFs are left alone so they
 * stay animated (the server rejects ones that are too big).
 */
async function shrinkIfNeeded(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  if (file.size <= 1.5 * 1024 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // let the server decide
  }
}

export async function uploadImage(
  file: File,
  purpose: "messages" | "recipients",
  boardShareSlug?: string,
): Promise<UploadResult> {
  if (!ACCEPTED_IMAGE_TYPES.split(",").includes(file.type)) {
    throw new Error("Please choose a JPEG, PNG, WebP or GIF image.");
  }
  const body = await shrinkIfNeeded(file);
  if (body.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      file.type === "image/gif"
        ? "That GIF is too big (max 4 MB). Try a smaller one."
        : "That image is too big. Try a smaller one.",
    );
  }

  const form = new FormData();
  form.set("file", body, file.name);
  form.set("purpose", purpose);
  if (boardShareSlug) form.set("board", boardShareSlug);

  const response = await fetch("/api/uploads", { method: "POST", body: form });
  const data = (await response
    .json()
    .catch(() => ({}))) as Partial<UploadResult> & {
    error?: string;
  };
  if (!response.ok || !data.key) {
    throw new Error(data.error ?? "The upload failed. Please try again.");
  }
  return data as UploadResult;
}
