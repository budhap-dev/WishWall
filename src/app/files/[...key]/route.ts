import { env } from "@/lib/env";
import { isStorageKey, localDisk } from "@/server/storage";

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Serves images saved by the local-disk storage driver (development).
 * Keys are validated against a strict pattern, so paths like ../../ can't
 * escape the upload directory.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/files/[...key]">,
) {
  if (env.STORAGE_DRIVER !== "local")
    return new Response("Not found", { status: 404 });

  const key = (await params).key.join("/");
  if (!isStorageKey(key)) return new Response("Not found", { status: 404 });

  const body = await localDisk.read(key);
  if (!body) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type":
        CONTENT_TYPES[key.split(".").pop()!] ?? "application/octet-stream",
      // Keys are random and never reused, so files are immutable.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
