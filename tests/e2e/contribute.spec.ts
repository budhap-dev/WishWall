import type { Browser, Page } from "@playwright/test";
import sharp from "sharp";
import { createTestBoard, expect, test, withDb } from "./fixtures";

async function pngBuffer(width = 800, height = 600) {
  return sharp({
    create: { width, height, channels: 3, background: "#f472b6" },
  })
    .png()
    .toBuffer();
}

async function guestPage(browser: Browser, slug: string): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/board/${slug}`);
  return page;
}

async function postMessage(page: Page, text: string, name: string) {
  await page.getByRole("button", { name: "Add a message" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Message").fill(text);
  await dialog.getByLabel("Your name").fill(name);
  await dialog.getByRole("button", { name: "Post message" }).click();
  return dialog;
}

const card = (page: Page, author: string) =>
  page.getByRole("article").filter({ hasText: `— ${author}` });

test("a guest posts with a photo, edits, and deletes their message", async ({
  browser,
  user,
}) => {
  const board = await createTestBoard(user.id);
  const page = await guestPage(browser, board.shareSlug);
  await expect(
    page.getByRole("heading", { name: "Happy Birthday, Maya!" }),
  ).toBeVisible();
  await expect(page.getByText("No messages yet. Be the first!")).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute(
    "href",
    `/signin?callbackUrl=${encodeURIComponent(`/board/${board.shareSlug}`)}`,
  );

  await page.getByRole("button", { name: "Add a message" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Message").fill("Have the **best** day!");
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: await pngBuffer(),
  });
  await expect(dialog.getByRole("button", { name: "Replace" })).toBeVisible();
  await dialog.getByLabel("Describe the image").fill("A pink square");
  await dialog.getByRole("radio", { name: "Sky" }).check({ force: true });
  await dialog.getByLabel("Your name").fill("Guest Gina");
  await dialog.getByRole("button", { name: "Post message" }).click();
  await expect(dialog).toBeHidden();

  const mine = card(page, "Guest Gina");
  await expect(mine.locator("strong")).toHaveText("best");
  const image = mine.getByRole("img", { name: "A pink square" });
  await expect(image).toBeVisible();
  expect(
    await image.evaluate((img: HTMLImageElement) => img.naturalWidth),
  ).toBeGreaterThan(0);

  // Stored without EXIF, re-encoded to WebP, sized as uploaded.
  const row = await withDb((db) =>
    db.query(
      `SELECT "imageKey", "imageWidth", "editTokenHash", "authorId" FROM "Message" WHERE "boardId" = $1`,
      [board.id],
    ),
  );
  expect(row.rows[0].imageKey).toMatch(/^messages\/\d{4}\/[\w-]{22}\.webp$/);
  expect(row.rows[0].imageWidth).toBe(800);
  expect(row.rows[0].editTokenHash).toMatch(/^[0-9a-f]{64}$/); // only a hash is stored
  expect(row.rows[0].authorId).toBeNull();

  // Edit.
  await mine.getByRole("button", { name: "Edit your message" }).click();
  await dialog.getByLabel("Message").fill("Have the most _amazing_ day!");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).toBeHidden();
  await expect(mine.locator("em")).toHaveText("amazing");
  await expect(mine.getByRole("img", { name: "A pink square" })).toBeVisible(); // image kept

  // Someone else sees the message but can't edit or delete it.
  const other = await guestPage(browser, board.shareSlug);
  await expect(card(other, "Guest Gina")).toBeVisible();
  await expect(card(other, "Guest Gina").getByRole("button")).toHaveCount(0);

  // Delete.
  await mine.getByRole("button", { name: "Delete your message" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(card(page, "Guest Gina")).toHaveCount(0);
  const count = await withDb((db) =>
    db.query(`SELECT count(*)::int AS n FROM "Message" WHERE "boardId" = $1`, [
      board.id,
    ]),
  );
  expect(count.rows[0].n).toBe(0);
});

test("a signed-in contributor posts with their name filled in", async ({
  page,
  user,
}) => {
  const board = await createTestBoard(user.id);
  await page.goto(`/board/${board.shareSlug}`);
  await expect(page.getByText(`Signed in as ${user.name}.`)).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveCount(0);
  await page.getByRole("button", { name: "Add a message" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Your name")).toHaveValue(user.name);
  await dialog.getByLabel("Message").fill("From a signed-in friend");
  await dialog.getByRole("button", { name: "Post message" }).click();
  await expect(
    card(page, user.name).getByRole("button", { name: "Edit your message" }),
  ).toBeVisible();

  const row = await withDb((db) =>
    db.query(
      `SELECT "authorId", "editTokenHash" FROM "Message" WHERE "boardId" = $1`,
      [board.id],
    ),
  );
  expect(row.rows[0]).toEqual({ authorId: user.id, editTokenHash: null });

  // Signing out from the board stays on the board, now as a guest.
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/board/${board.shareSlug}$`));
});

test("surprise mode shows contributors only their own messages", async ({
  browser,
  page,
  user,
}) => {
  const board = await createTestBoard(user.id, { messagesVisible: false });

  const alice = await guestPage(browser, board.shareSlug);
  await expect(alice.getByText("It's a surprise!")).toBeVisible();
  await postMessage(alice, "Secret from Alice", "Alice");
  await expect(card(alice, "Alice")).toBeVisible();

  const bob = await guestPage(browser, board.shareSlug);
  await expect(bob.getByText("No messages yet")).toBeVisible();
  await postMessage(bob, "Secret from Bob", "Bob");
  await expect(card(bob, "Bob")).toBeVisible();
  await expect(card(bob, "Alice")).toHaveCount(0);

  // Alice still sees hers after a reload (fetched with her browser's token), not Bob's.
  await alice.reload();
  await expect(card(alice, "Alice")).toBeVisible();
  await expect(card(alice, "Bob")).toHaveCount(0);

  // The owner sees everything.
  await page.goto(`/board/${board.shareSlug}`);
  await expect(card(page, "Alice")).toBeVisible();
  await expect(card(page, "Bob")).toBeVisible();
});

test("closed and sign-in-only boards don't accept guest posts", async ({
  browser,
  request,
  user,
}) => {
  const closed = await createTestBoard(user.id, { status: "CLOSED" });
  const page = await guestPage(browser, closed.shareSlug);
  await expect(
    page.getByText("This board is closed to new messages."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add a message" })).toHaveCount(
    0,
  );

  const upload = async (slug: string) => {
    const response = await request.post("/api/uploads", {
      multipart: {
        purpose: "messages",
        board: slug,
        file: {
          name: "a.png",
          mimeType: "image/png",
          buffer: await pngBuffer(10, 10),
        },
      },
    });
    return response.status();
  };
  expect(await upload(closed.shareSlug)).toBe(403);

  const membersOnly = await createTestBoard(user.id, { allowGuests: false });
  await page.goto(`/board/${membersOnly.shareSlug}`);
  await expect(
    page.getByRole("link", { name: "Sign in to add a message" }),
  ).toBeVisible();
  expect(await upload(membersOnly.shareSlug)).toBe(401);
});

test("uploads are checked by content, not by name", async ({
  request,
  user,
}) => {
  const board = await createTestBoard(user.id);
  const post = (file: { name: string; mimeType: string; buffer: Buffer }) =>
    request.post("/api/uploads", {
      multipart: { purpose: "messages", board: board.shareSlug, file },
    });

  const fake = await post({
    name: "evil.png",
    mimeType: "image/png",
    buffer: Buffer.from("<script>alert(1)</script>"),
  });
  expect(fake.status()).toBe(422);

  const real = await post({
    name: "real.png",
    mimeType: "image/png",
    buffer: await pngBuffer(40, 30),
  });
  expect(real.status()).toBe(200);
  const body = await real.json();
  expect(body).toMatchObject({ width: 40, height: 30 });
  expect(body.key).toMatch(/\.webp$/);
  expect(body.token).toBeTruthy();

  // Recipient photos need a signed-in user; unknown purposes are rejected.
  const anon = await request.post("/api/uploads", {
    multipart: {
      purpose: "recipients",
      file: {
        name: "a.png",
        mimeType: "image/png",
        buffer: await pngBuffer(10, 10),
      },
    },
  });
  expect(anon.status()).toBe(401);
  const traversal = await request.get("/files/..%2F..%2F.env");
  expect(traversal.status()).toBe(404);
});

test("the owner can hide, unhide and delete messages", async ({
  browser,
  page,
  user,
}) => {
  const board = await createTestBoard(user.id);
  const guest = await guestPage(browser, board.shareSlug);
  await postMessage(guest, "Please moderate me", "Mo");
  await expect(card(guest, "Mo")).toBeVisible();

  await page.goto(`/dashboard/boards/${board.id}`);
  const row = page
    .getByRole("listitem")
    .filter({ hasText: "Please moderate me" });
  await row.getByRole("button", { name: "Hide" }).click();
  await expect(row.getByText("Hidden", { exact: true })).toBeVisible();

  await guest.reload();
  await expect(card(guest, "Mo")).toHaveCount(0);

  await row.getByRole("button", { name: "Unhide" }).click();
  await expect(row.getByText("Hidden", { exact: true })).toHaveCount(0);
  await guest.reload();
  await expect(card(guest, "Mo")).toBeVisible();

  await row.getByRole("button", { name: "Delete" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete" })
    .click();
  await expect(page.getByText("Please moderate me")).toHaveCount(0);
});

test("posting is rate limited per board", async ({ browser, user }) => {
  // The e2e server runs with RATE_LIMIT_PER_BOARD=5 (see playwright.config.ts).
  const board = await createTestBoard(user.id);
  const page = await guestPage(browser, board.shareSlug);
  for (let i = 1; i <= 5; i++) {
    const dialog = await postMessage(page, `Message ${i}`, `Poster ${i}`);
    await expect(dialog).toBeHidden();
  }
  const dialog = await postMessage(page, "One too many", "Poster 6");
  await expect(dialog.getByRole("alert")).toContainText("lots of messages");
});
