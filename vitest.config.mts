import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // Server modules import "server-only", which throws outside RSC.
      "server-only": fileURLToPath(
        new URL("./tests/unit/stubs/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    environment: "node",
    // Server modules read env at import time; unit tests never touch the DB.
    env: { SKIP_ENV_VALIDATION: "1", AUTH_SECRET: "unit-test-secret" },
  },
});
