import "server-only";
import { createHash } from "node:crypto";
import { env } from "@/lib/env";

/**
 * The client's IP, for rate limiting only. On Vercel, `x-forwarded-for` is
 * set by the platform (the left-most entry is the client). It's hashed with a
 * server secret so raw IPs never land in the database.
 */
export function clientIpKey(headers: Headers): string {
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown";
  return createHash("sha256")
    .update(`ip:${env.AUTH_SECRET}:${ip}`)
    .digest("base64url")
    .slice(0, 32);
}

export function clientIp(headers: Headers): string | undefined {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    undefined
  );
}
