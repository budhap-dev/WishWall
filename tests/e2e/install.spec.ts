import { devices } from "@playwright/test";
import { expect, test } from "./fixtures";

const banner = (page: import("@playwright/test").Page) =>
  page.getByRole("complementary", { name: "Install WishWall" });

test("the app has a manifest and home-screen icons", async ({
  page,
  request,
}) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest).toMatchObject({
    name: "WishWall",
    start_url: "/dashboard",
    display: "standalone",
  });
  for (const icon of manifest.icons as { src: string }[]) {
    const img = await request.get(icon.src);
    expect(img.headers()["content-type"], icon.src).toBe("image/png");
  }

  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

test("Android offers an Install button; desktop shows nothing", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (!isMobile) {
    await page.waitForLoadState("networkidle");
    await expect(banner(page)).toHaveCount(0);
    return;
  }

  // Nothing until Chrome says the app is installable…
  await expect(banner(page)).toHaveCount(0);
  // …which it signals with beforeinstallprompt (simulated here; retried
  // until the page has hydrated and is listening).
  await expect(async () => {
    await page.evaluate(() => {
      const event = Object.assign(
        new Event("beforeinstallprompt", { cancelable: true }),
        {
          prompt: async () => {
            (window as { prompted?: boolean }).prompted = true;
          },
          userChoice: Promise.resolve({ outcome: "accepted" }),
        },
      );
      window.dispatchEvent(event);
    });
    await expect(banner(page)).toBeVisible({ timeout: 500 });
  }).toPass();

  await banner(page).getByRole("button", { name: "Install" }).click();
  expect(
    await page.evaluate(() => (window as { prompted?: boolean }).prompted),
  ).toBe(true);
  await expect(banner(page)).toHaveCount(0);
});

test("iPhones get Add to Home Screen steps, until dismissed", async ({
  browser,
  isMobile,
}) => {
  test.skip(!isMobile, "phone-only");
  const context = await browser.newContext(devices["iPhone 15"]);
  const page = await context.newPage();
  await page.goto("/");
  await expect(banner(page)).toContainText("Add to Home Screen");

  await banner(page).getByRole("button", { name: "Dismiss" }).click();
  await expect(banner(page)).toHaveCount(0);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(banner(page)).toHaveCount(0);
  await context.close();
});
