import { createTestBoard, expect, insertMessages, test } from "./fixtures";

const open = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: /Open your card for Maya/ }).click();

test("the recipient opens the card and sees every visible message", async ({
  page,
  user,
}) => {
  // Surprise mode only limits contributors; the recipient sees everything not hidden.
  const board = await createTestBoard(user.id, { messagesVisible: false });
  await insertMessages(board.id, [
    { author: "Priya", body: "Happy **birthday**!" },
    { author: "Sam", body: "See you Saturday" },
    { author: "Troll", body: "Hidden by the owner", hidden: true },
  ]);

  await page.goto(`/board/${board.revealSlug}/reveal`);
  await expect(page.getByText("A card for")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Happy Birthday, Maya!" }),
  ).toHaveCount(0);

  await open(page);
  const title = page.getByRole("heading", { name: "Happy Birthday, Maya!" });
  await expect(title).toBeVisible();
  await expect(title).toBeFocused();
  await expect(page.getByText("2 messages from 2 people")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(
    page.getByRole("article").filter({ hasText: "Priya" }).locator("strong"),
  ).toHaveText("birthday");
  await expect(page.getByText("Hidden by the owner")).toHaveCount(0);
});

test("contribute and reveal links can't be swapped", async ({ page, user }) => {
  const board = await createTestBoard(user.id);
  await page.goto(`/board/${board.shareSlug}/reveal`);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await page.goto(`/board/${board.revealSlug}`);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});

test("cards enlarge, and arrow keys move between them", async ({
  page,
  user,
}) => {
  const board = await createTestBoard(user.id);
  await insertMessages(board.id, [
    { author: "Ann", body: "First message" },
    { author: "Ben", body: "Second message" },
    { author: "Cat", body: "Third message" },
  ]);
  await page.goto(`/board/${board.revealSlug}/reveal`);
  await open(page);

  await page.getByRole("button", { name: "Read Ben's message" }).click();
  const dialog = page.getByRole("dialog", { name: "Message from Ben" });
  await expect(dialog).toContainText("Second message");
  await expect(dialog).toContainText("2 / 3");

  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("dialog", { name: "Message from Cat" }),
  ).toContainText("3 / 3");
  await page.keyboard.press("ArrowRight"); // wraps around
  await expect(
    page.getByRole("dialog", { name: "Message from Ann" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Previous message" }).click();
  await expect(
    page.getByRole("dialog", { name: "Message from Cat" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("reduced motion skips the animations", async ({ browser, user }) => {
  const board = await createTestBoard(user.id);
  await insertMessages(board.id, [{ author: "Ann", body: "Calm and still" }]);
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(`/board/${board.revealSlug}/reveal`);
  await open(page);
  // No opening sequence: the card is there straight away, fully opaque.
  const card = page.getByRole("article").filter({ hasText: "Calm and still" });
  await expect(card).toBeVisible({ timeout: 500 });
  await expect(
    page.getByRole("button", { name: /Open your card/ }),
  ).toHaveCount(0);
  // Confetti (a moving decoration) isn't rendered at all.
  await expect(page.locator(".ww-particle")).toHaveCount(0);
  await context.close();
});

test("large boards load more cards as you scroll", async ({ page, user }) => {
  const total = 120;
  const board = await createTestBoard(user.id);
  await insertMessages(
    board.id,
    Array.from({ length: total }, (_, i) => ({
      author: `Friend ${i + 1}`,
      body: `Message number ${i + 1}`,
    })),
  );
  await page.goto(`/board/${board.revealSlug}/reveal`);
  await open(page);
  await expect(
    page.getByText(`${total} messages from ${total} people`),
  ).toBeVisible();

  // Not everything renders up front (batches load ~800px before you reach them)…
  const cards = page.getByRole("article");
  await expect(page.getByText("Loading more messages")).toBeVisible();
  expect(await cards.count()).toBeLessThan(total);

  // …but scrolling to the end reveals every card.
  await expect(async () => {
    await page.mouse.wheel(0, 4000);
    await expect(cards).toHaveCount(total, { timeout: 500 });
  }).toPass({ timeout: 15_000 });
  await expect(page.getByText("Loading more messages")).toHaveCount(0);
});
