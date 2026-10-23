import { createTestBoard, expect, insertMessages, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const open = (page: Page) =>
  page.getByRole("button", { name: /Open your card for Maya/ }).click();

/** Read the book page by page to the end, then go to the wall of every card. */
async function readThrough(page: Page, messages: number) {
  await page.getByRole("button", { name: "Start reading" }).click();
  for (let i = 0; i < messages; i++) await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "See all messages" }).click();
}

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
  await expect(page.getByText("A card for", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Happy Birthday, Maya!" }),
  ).toHaveCount(0);

  await open(page);
  // The book opens on its cover…
  const title = page.getByRole("heading", { name: "Happy Birthday, Maya!" });
  await expect(title).toBeVisible();
  await expect(title).toBeFocused();
  await expect(page.getByText("2 messages inside")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(0);
  // No skipping ahead before reading.
  await expect(
    page.getByRole("button", { name: "See all", exact: true }),
  ).toHaveCount(0);

  // …and after the last page, the wall shows every card.
  await readThrough(page, 2);
  await expect(title).toBeFocused();
  await expect(page.getByText("2 messages from 2 people")).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(
    page.getByRole("article").filter({ hasText: "Priya" }).locator("strong"),
  ).toHaveText("birthday");
  await expect(page.getByText("Hidden by the owner")).toHaveCount(0);
});

test("messages turn like the pages of a book, then show all at once", async ({
  page,
  user,
}) => {
  const board = await createTestBoard(user.id);
  await insertMessages(board.id, [
    { author: "Ann", body: "First message" },
    { author: "Ben", body: "Second message" },
  ]);
  await page.goto(`/board/${board.revealSlug}/reveal`);
  await open(page);
  await expect(page.getByText("Cover", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Start reading" }).click();
  await expect(page.getByText("Message 1 of 2")).toBeVisible();
  await expect(
    page.getByRole("article").filter({ hasText: "First message" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Message 2 of 2")).toBeVisible();
  await expect(
    page.getByRole("article").filter({ hasText: "Second message" }),
  ).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("Message 1 of 2")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");

  // The last page leads to the wall (and the PDF).
  await expect(page.getByText("The end", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next page" })).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Download PDF" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "See all messages" }).click();
  await expect(
    page.getByRole("heading", { name: "Happy Birthday, Maya!" }),
  ).toBeFocused();
  await expect(page.getByRole("article")).toHaveCount(2);

  // And back to the book from the wall.
  // And back to the book from the wall, which may now skip ahead.
  await page.getByRole("button", { name: "Read as a book" }).click();
  await expect(page.getByText("Cover", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "See all", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(2);
});

test("a swipe turns the page", async ({ page, user }) => {
  const board = await createTestBoard(user.id);
  await insertMessages(board.id, [{ author: "Ann", body: "Swiped to me" }]);
  await page.goto(`/board/${board.revealSlug}/reveal`);
  await open(page);
  // Wait for the opener to finish (it hands focus to the cover's title).
  const title = page.getByRole("heading", { name: "Happy Birthday, Maya!" });
  await expect(title).toBeFocused();
  // …and the card to finish coming out of the envelope.
  await page
    .getByRole("button", { name: "Start reading" })
    .click({ trial: true });

  const box = (await title.boundingBox())!;
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 60, y, { steps: 4 });
  await page.mouse.move(x - 160, y, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByText("Message 1 of 1")).toBeVisible();
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
  await readThrough(page, 3);

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
  // No opening sequence or page turn: each page is there straight away.
  await page.getByRole("button", { name: "Start reading" }).click();
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
  await readThrough(page, total);
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
