import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

// E2E tests run against a production build using the database in .env (use a
// dev database/branch, never production). Fixtures create and delete their
// own data.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Test a production build: it's what users get, it catches prod-only
    // problems, and it avoids dev-mode on-demand compilation/HMR reloads that
    // make browser tests flaky. Next binaries are called directly because a
    // `pnpm` wrapper doesn't forward the shutdown signal.
    command: `node_modules/.bin/next build && node_modules/.bin/next start --port ${PORT}`,
    url: `${baseURL}/api/health`,
    // Always start fresh so a stale server never runs the tests.
    reuseExistingServer: false,
    timeout: 180_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
    env: { APP_URL: baseURL },
  },
});
