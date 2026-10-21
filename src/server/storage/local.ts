import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { isStorageKey, type StorageAdapter } from "./types";

/**
 * Local-disk storage for development. Files are served by the
 * /files/[...key] route. Not for production: serverless disks are ephemeral.
 */
export function createLocalStorage(dir: string): StorageAdapter & {
  read(key: string): Promise<Buffer | null>;
} {
  const root = path.resolve(dir);

  function filePath(key: string): string {
    if (!isStorageKey(key)) throw new Error("Invalid storage key");
    return path.join(root, key);
  }

  return {
    async put({ key, body }) {
      const file = filePath(key);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, body, { flag: "wx" }); // never overwrite
    },
    async delete(key) {
      await rm(filePath(key), { force: true });
    },
    url(key) {
      return `/files/${key}`;
    },
    async read(key) {
      try {
        return await readFile(filePath(key));
      } catch {
        return null;
      }
    },
  };
}
