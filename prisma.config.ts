import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrations, studio) uses a direct, non-pooled connection when one is
// provided. On Neon, DATABASE_URL is the pooled "-pooler" host and DIRECT_URL
// is the direct host; locally they can be the same.
//
// Read via process.env (not prisma's env() helper) so `prisma generate` works
// in CI/build steps where no database URL is set.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
