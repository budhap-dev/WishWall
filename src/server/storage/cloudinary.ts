import "server-only";
import { createHash } from "node:crypto";
import { isStorageKey, type StorageAdapter } from "./types";

type Config = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
};

/**
 * Cloudinary storage via its signed REST API (no SDK needed).
 * A key "messages/2026/abc.webp" becomes public_id "<folder>/messages/2026/abc".
 * Images are delivered from res.cloudinary.com; see cloudinaryLoader for resizing.
 */
export function createCloudinaryStorage(config: Config): StorageAdapter {
  const api = `https://api.cloudinary.com/v1_1/${config.cloudName}/image`;

  function publicId(key: string): string {
    if (!isStorageKey(key)) throw new Error("Invalid storage key");
    return `${config.folder}/${key.replace(/\.[a-z]+$/, "")}`;
  }

  // https://cloudinary.com/documentation/authentication_signatures
  function sign(params: Record<string, string>): string {
    const toSign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    return createHash("sha1")
      .update(toSign + config.apiSecret)
      .digest("hex");
  }

  async function call(
    endpoint: "upload" | "destroy",
    params: Record<string, string>,
    file?: Blob,
  ) {
    const signed = {
      ...params,
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const form = new FormData();
    for (const [k, v] of Object.entries(signed)) form.set(k, v);
    form.set("api_key", config.apiKey);
    form.set("signature", sign(signed));
    if (file) form.set("file", file);

    const response = await fetch(`${api}/${endpoint}`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Cloudinary ${endpoint} failed (${response.status}): ${detail.slice(0, 200)}`,
      );
    }
    return response.json() as Promise<Record<string, unknown>>;
  }

  return {
    async put({ key, body, contentType }) {
      await call(
        "upload",
        { public_id: publicId(key), overwrite: "false" },
        new Blob([new Uint8Array(body)], { type: contentType }),
      );
    },
    async delete(key) {
      // "not found" is a successful response, so this is idempotent.
      await call("destroy", { public_id: publicId(key), invalidate: "true" });
    },
    url(key) {
      const ext = key.split(".").pop();
      return `https://res.cloudinary.com/${config.cloudName}/image/upload/${publicId(key)}.${ext}`;
    },
  };
}
