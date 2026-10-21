import { randomBytes } from "node:crypto";

/** 24 random bytes = 192 bits of entropy, encoded as 32 URL-safe characters. */
const SLUG_BYTES = 24;

export const SLUG_PATTERN = /^[A-Za-z0-9_-]{32}$/;

/** Unguessable slug for share/reveal links. Boards are never listed, so the slug is the only way in. */
export function generateSlug(): string {
  return randomBytes(SLUG_BYTES).toString("base64url");
}

/** Cheap shape check to reject junk before touching the database. */
export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}
