import { version } from "../../package.json";
import { expect, test } from "./fixtures";

const main = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "Main" });

test("signed-out visitors can find sign-in and board creation", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo")).toContainText(`v${version}`);

  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(menu).toContainText(`v${version}`);
    await menu.getByRole("link", { name: "Sign in" }).click();
  } else {
    await expect(
      main(page).getByRole("link", { name: "Create a board" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Sign in" }).click();
  }
  await expect(page).toHaveURL(/\/signin/);
});

test("signed-in users move between their boards and a new one", async ({
  page,
  user,
  isMobile,
}) => {
  await page.goto("/dashboard");
  const link = (name: string) =>
    isMobile
      ? page.getByRole("dialog").getByRole("link", { name })
      : main(page).getByRole("link", { name });
  const openMenu = async () => {
    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click();
  };

  await openMenu();
  await expect(link("My boards")).toHaveAttribute("aria-current", "page");
  if (isMobile) await expect(page.getByRole("dialog")).toContainText(user.name);
  await link("New board").click();
  await expect(page).toHaveURL(/\/dashboard\/new$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await openMenu();
  await expect(link("New board")).toHaveAttribute("aria-current", "page");
  await link("My boards").click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
