import { createTestBoard, expect, test, withDb } from "./fixtures";

test("contributors can pick a font and a readable text colour", async ({
  browser,
  user,
}) => {
  const board = await createTestBoard(user.id);
  const page = await (await browser.newContext()).newPage();
  await page.goto(`/board/${board.shareSlug}`);

  await page.getByRole("button", { name: "Add a message" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Message").fill("Styled with love");
  await dialog.getByLabel("Your name").fill("Stella");
  // Click the visible chips, as a person would (the radios are visually hidden).
  await dialog.locator("label").filter({ hasText: "Handwritten" }).click();

  // White isn't readable on this light card colour, so it's disabled.
  await expect(dialog.getByRole("radio", { name: /White/ })).toBeDisabled();
  await dialog
    .locator("label")
    .filter({ hasText: /^ABlue$/ })
    .click();
  await expect(dialog.getByRole("radio", { name: "Blue" })).toBeChecked();
  await dialog.getByRole("button", { name: "Post message" }).click();
  await expect(dialog).toBeHidden();

  // Font and colour apply to the message text.
  const text = page
    .getByRole("article")
    .filter({ hasText: "Stella" })
    .getByText("Styled with love");
  const style = await text.evaluate((el) => {
    const s = getComputedStyle(el);
    return { font: s.fontFamily, color: s.color };
  });
  expect(style.font).toContain("Caveat");
  expect(style.color).toBe("rgb(29, 78, 216)"); // blue

  const row = await withDb((db) =>
    db.query(`SELECT font, "textColor" FROM "Message" WHERE "boardId" = $1`, [
      board.id,
    ]),
  );
  expect(row.rows[0]).toEqual({ font: "handwritten", textColor: "blue" });
});

test("an unreadable stored colour falls back to the template's", async ({
  page,
  user,
}) => {
  // e.g. the owner switched to a template where white text no longer works.
  const board = await createTestBoard(user.id);
  await withDb((db) =>
    db.query(
      `INSERT INTO "Message" (id, "boardId", "authorName", body, "cardColor", "textColor", "updatedAt")
       VALUES ('e2emsgwhite' || md5(random()::text), $1, 'Wendy', 'White on pastel', 'c1', 'white', now())`,
      [board.id],
    ),
  );
  await page.goto(`/board/${board.shareSlug}`);
  const color = await page
    .getByRole("article")
    .filter({ hasText: "Wendy" })
    .getByText("White on pastel")
    .evaluate((el) => getComputedStyle(el).color);
  expect(color).not.toBe("rgb(255, 255, 255)");
});

test("board links carry link-preview tags for WhatsApp", async ({
  request,
  user,
}) => {
  const board = await createTestBoard(user.id);
  const whatsapp = { "User-Agent": "WhatsApp/2.23.20.0 A" };

  const html = await (
    await request.get(`/board/${board.shareSlug}`, { headers: whatsapp })
  ).text();
  const head = html.slice(0, html.indexOf("</head>"));
  expect(head).toContain(
    '<meta property="og:title" content="Sign the card for Maya ✍️"',
  );
  expect(head).toContain("Happy Birthday, Maya! · Add your message.");
  const image = head.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  expect(image).toMatch(
    /^http:\/\/localhost:3100\/board\/[\w-]{32}\/opengraph-image/,
  );

  const png = await request.get(image!);
  expect(png.status()).toBe(200);
  expect(png.headers()["content-type"]).toBe("image/png");

  // The recipient's link previews without spoilers: no board title in the
  // preview tags (the page itself needs it, once opened).
  const reveal = await (
    await request.get(`/board/${board.revealSlug}/reveal`, {
      headers: whatsapp,
    })
  ).text();
  const previewTags = [
    ...reveal.matchAll(
      /<meta (?:property|name)="(?:og|twitter):[^"]+" content="([^"]*)"/g,
    ),
  ]
    .map((m) => m[1])
    .join("\n");
  expect(previewTags).toContain("A card for Maya 💌");
  expect(previewTags).not.toContain("Happy Birthday");
});
