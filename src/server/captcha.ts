import "server-only";
import { env } from "@/lib/env";

/** Whether guest posts must pass a Cloudflare Turnstile check. */
export function captchaRequired(): boolean {
  return env.CAPTCHA_ENABLED;
}

/** Public site key for the browser widget, or null when CAPTCHA is off. */
export function captchaSiteKey(): string | null {
  return captchaRequired() ? env.NEXT_PUBLIC_TURNSTILE_SITE_KEY! : null;
}

/** Verifies a Turnstile token with Cloudflare. Always true when CAPTCHA is off. */
export async function verifyCaptcha(
  token: string | undefined,
  ip?: string,
): Promise<boolean> {
  if (!captchaRequired()) return true;
  if (!token) return false;

  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET_KEY!);
  body.set("response", token);
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
      },
    );
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("Turnstile verification failed", error);
    return false;
  }
}
