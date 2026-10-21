import "server-only";
import { z } from "zod";

/**
 * Server-side environment, validated once at startup. Import `env` instead of
 * reading process.env directly so a missing/typo'd variable fails loudly.
 * Every variable here is documented in .env.example.
 */

// "true"/"1" → true; anything else (including unset) → false.
const booleanFlag = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const serverSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Database
    DATABASE_URL: z.url(),

    // Public base URL of the app (share links, PDF rendering)
    APP_URL: z.url().default("http://localhost:3000"),

    // Auth.js
    AUTH_SECRET: z.string().min(1),
    AUTH_GOOGLE_ID: z.string().min(1),
    AUTH_GOOGLE_SECRET: z.string().min(1),

    // Image storage
    STORAGE_DRIVER: z.enum(["local", "cloudinary"]).default("local"),
    LOCAL_UPLOAD_DIR: z.string().default("./uploads"),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    UPLOAD_MAX_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 1024 * 1024),

    // Rate limiting (messages per hour)
    RATE_LIMIT_PER_IP: z.coerce.number().int().positive().default(10),
    RATE_LIMIT_PER_BOARD: z.coerce.number().int().positive().default(200),

    // Cloudflare Turnstile for guest posts
    CAPTCHA_ENABLED: booleanFlag,
    TURNSTILE_SECRET_KEY: z.string().optional(),

    // Dev-only "Continue as demo user" sign-in (ignored outside `next dev`).
    DEV_LOGIN: booleanFlag,
  })
  .superRefine((e, ctx) => {
    if (
      e.STORAGE_DRIVER === "cloudinary" &&
      !(
        e.CLOUDINARY_CLOUD_NAME &&
        e.CLOUDINARY_API_KEY &&
        e.CLOUDINARY_API_SECRET
      )
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "STORAGE_DRIVER=cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET",
      });
    }
    if (e.CAPTCHA_ENABLED && !e.TURNSTILE_SECRET_KEY) {
      ctx.addIssue({
        code: "custom",
        message: "CAPTCHA_ENABLED=true requires TURNSTILE_SECRET_KEY",
      });
    }
  });

export type ServerEnv = z.infer<typeof serverSchema>;

function parseEnv(): ServerEnv {
  // Escape hatch for tooling that imports app code without a full env (e.g.
  // lint/typecheck in CI). Never set this in a running deployment.
  if (process.env.SKIP_ENV_VALIDATION === "1") {
    return process.env as unknown as ServerEnv;
  }
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(env)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${details}`);
  }
  return result.data;
}

export const env = parseEnv();
