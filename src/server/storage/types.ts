/**
 * Where uploaded images live. The database stores only a storage *key*
 * (e.g. "messages/2026/AbC…xyz.webp"); the adapter turns it into a URL. That
 * keeps the data portable between drivers.
 */
export interface StorageAdapter {
  put(input: { key: string; body: Buffer; contentType: string }): Promise<void>;
  /** Best effort: resolves even if the object is already gone. */
  delete(key: string): Promise<void>;
  /** Public URL for a key (relative for local storage, absolute for CDNs). */
  url(key: string): string;
}

export const IMAGE_PURPOSES = ["messages", "recipients"] as const;
export type ImagePurpose = (typeof IMAGE_PURPOSES)[number];

export const IMAGE_EXTENSIONS = ["webp", "gif"] as const;
export type ImageExtension = (typeof IMAGE_EXTENSIONS)[number];

/** Shape of every key we generate; anything else is rejected before touching storage. */
export const STORAGE_KEY_PATTERN =
  /^(messages|recipients)\/\d{4}\/[A-Za-z0-9_-]{22}\.(webp|gif)$/;

export function isStorageKey(value: string): boolean {
  return STORAGE_KEY_PATTERN.test(value);
}
