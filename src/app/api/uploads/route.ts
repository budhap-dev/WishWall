import { env } from "@/lib/env";
import { isValidSlug } from "@/lib/slug";
import { clientIpKey } from "@/server/client-ip";
import { ImageRejectedError, processImage } from "@/server/images";
import { consumeRateLimit, retryAfterText } from "@/server/rate-limit";
import { getBoardByShareSlug } from "@/server/services/boards";
import { getCurrentUser } from "@/server/session";
import { newStorageKey, storage, uploadsEnabled } from "@/server/storage";
import { signUpload } from "@/server/upload-token";

/**
 * POST /api/uploads (multipart: file, purpose, board?)
 *
 * - purpose "messages": for posting on a board; `board` is its share slug,
 *   and the same rules as posting apply (board open, guests allowed or signed in).
 * - purpose "recipients": a board's recipient photo; signed-in users only.
 *
 * Returns { key, url, width, height, token }. The token is an HMAC the
 * message/board actions verify, so only images that came through here can be
 * attached.
 */
export async function POST(request: Request) {
  const fail = (status: number, error: string) =>
    Response.json({ error }, { status });

  if (!uploadsEnabled) return fail(404, "Uploads are turned off.");

  // Serverless filesystems are read-only/ephemeral: local storage only works
  // on a long-running server. Say so plainly instead of failing obscurely.
  if (process.env.VERCEL && env.STORAGE_DRIVER === "local") {
    return fail(503, "Photo uploads aren't set up on this site yet.");
  }

  // Reject oversized bodies before reading them (multipart adds a little overhead).
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > env.UPLOAD_MAX_BYTES + 64 * 1024) {
    return fail(
      413,
      `Images must be ${formatMb(env.UPLOAD_MAX_BYTES)} or smaller.`,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "Invalid upload.");
  }
  const file = form.get("file");
  const purpose = form.get("purpose");
  if (!(file instanceof File)) return fail(400, "No file was uploaded.");
  if (file.size > env.UPLOAD_MAX_BYTES) {
    return fail(
      413,
      `Images must be ${formatMb(env.UPLOAD_MAX_BYTES)} or smaller.`,
    );
  }

  const user = await getCurrentUser();
  if (purpose === "recipients") {
    if (!user) return fail(401, "Please sign in.");
  } else if (purpose === "messages") {
    const slug = form.get("board");
    const board =
      typeof slug === "string" && isValidSlug(slug)
        ? await getBoardByShareSlug(slug)
        : null;
    if (!board) return fail(404, "Board not found.");
    if (board.status !== "OPEN")
      return fail(403, "This board is closed to new messages.");
    if (!user && !board.allowGuests)
      return fail(401, "Please sign in to post on this board.");
  } else {
    return fail(400, "Invalid upload.");
  }

  const limit = await consumeRateLimit(
    `upload:ip:${clientIpKey(request.headers)}`,
    env.RATE_LIMIT_UPLOADS_PER_IP,
    60 * 60,
  );
  if (!limit.ok) {
    return fail(
      429,
      `Too many uploads. Please try again in ${retryAfterText(limit.resetAt)}.`,
    );
  }

  try {
    const image = await processImage(Buffer.from(await file.arrayBuffer()));
    const key = newStorageKey(purpose, image.ext);
    await storage.put({
      key,
      body: image.body,
      contentType: image.contentType,
    });
    const uploaded = { key, width: image.width, height: image.height };
    return Response.json({
      ...uploaded,
      url: storage.url(key),
      token: signUpload(uploaded),
    });
  } catch (error) {
    if (error instanceof ImageRejectedError) return fail(422, error.message);
    console.error("Upload failed", error);
    return fail(500, "The upload failed. Please try again.");
  }
}

function formatMb(bytes: number) {
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;
}
