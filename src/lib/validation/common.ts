import { z } from "zod";

// Strip control characters (except newline/tab) that have no business in user
// text. Content is rendered as React text, never HTML, so this is hygiene,
// not XSS defence.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Single-line text: trimmed, inner whitespace collapsed. */
export function singleLine(max: number, label: string) {
  return z
    .string()
    .transform((s) => s.replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim())
    .pipe(
      z
        .string()
        .min(1, `${label} is required`)
        .max(max, `${label} must be ${max} characters or fewer`),
    );
}

/** Multi-line text: trimmed, CRLF normalised, at most 2 consecutive blank lines. Empty → null. */
export function multiLine(max: number, label: string) {
  return z
    .string()
    .transform((s) =>
      s
        .replace(/\r\n?/g, "\n")
        .replace(CONTROL_CHARS, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim(),
    )
    .pipe(z.string().max(max, `${label} must be ${max} characters or fewer`))
    .transform((s) => (s === "" ? null : s));
}

/** Optional `YYYY-MM-DD` from <input type="date">; "" → null. Stored as UTC midnight. */
export const optionalDate = z
  .string()
  .trim()
  .refine(
    (s) => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s),
    "Enter a valid date",
  )
  .transform((s) => (s === "" ? null : new Date(`${s}T00:00:00.000Z`)))
  .refine(
    (d) =>
      d === null ||
      (!Number.isNaN(d.getTime()) &&
        d.getUTCFullYear() >= 1900 &&
        d.getUTCFullYear() <= 2100),
    "Enter a valid date",
  );

/** Database ids (cuid). Loose shape check to reject junk early. */
export const idSchema = z.string().regex(/^[a-z0-9]{20,40}$/i, "Invalid id");

/** Uniform result type for Server Actions called from client components. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[] | undefined>;
    };

export function fieldErrorResult(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: "Please fix the highlighted fields.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<
      string,
      string[] | undefined
    >,
  };
}
