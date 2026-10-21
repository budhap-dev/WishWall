/**
 * Returns `target` if it's a same-site relative path, otherwise `fallback`.
 * Stops `?callbackUrl=https://evil.example` (or `//evil.example`, which
 * browsers treat as protocol-relative) from turning sign-in into an open
 * redirect.
 */
export function safeRedirectPath(
  target: unknown,
  fallback = "/dashboard",
): string {
  if (typeof target !== "string") return fallback;
  if (
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.startsWith("/\\")
  ) {
    return fallback;
  }
  // Reject anything that would parse to a different origin.
  try {
    const base = "http://wishwall.invalid";
    const url = new URL(target, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
