import { readFile } from "node:fs/promises";
import { createTestBoard, expect, insertMessages, test } from "./fixtures";

/** Page widths (points) from a PDF's /MediaBox entries. */
function pageWidths(pdf: Buffer): number[] {
  return [...pdf.toString("latin1").matchAll(/\/MediaBox \[0 0 ([\d.]+)/g)].map(
    (m) => Math.round(Number(m[1])),
  );
}

test("the recipient downloads the board as a PDF", async ({ page, user }) => {
  const board = await createTestBoard(user.id);
  await insertMessages(board.id, [
    { author: "Priya", body: "Happy birthday! 🎂" },
    { author: "Sam", body: "See you Saturday" },
  ]);
  await page.goto(`/board/${board.revealSlug}/reveal`);
  await page.getByRole("button", { name: /Open your card for Maya/ }).click();

  await page.getByRole("button", { name: "Download PDF" }).click();
  // The preview frames the print page and shows its page count once laid out.
  const preview = page.getByRole("dialog", { name: "Preview your card" });
  await expect(preview.getByText("2 pages")).toBeVisible();
  await expect(
    preview
      .frameLocator("iframe")
      .getByRole("heading", { name: "Happy Birthday, Maya!" }),
  ).toBeVisible();
  await expect(preview.getByRole("radio", { name: /A4/ })).toBeChecked();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    preview.getByRole("button", { name: "Download", exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("Happy Birthday, Maya!.pdf");
  await expect(page.getByText("PDF downloaded")).toBeVisible();

  const pdf = await readFile((await download.path())!);
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  // The cover and one page of messages, all A4 (595.92pt wide): no blank
  // page at the end.
  const widths = pageWidths(pdf);
  expect(widths).toHaveLength(2);
  expect(new Set(widths)).toEqual(new Set([596]));
});

test("the PDF comes in US Letter too", async ({ request, user }) => {
  const board = await createTestBoard(user.id);
  await insertMessages(board.id, [{ author: "Ann", body: "Hello" }]);
  const res = await request.get(`/board/${board.revealSlug}/pdf?paper=letter`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("application/pdf");
  expect(new Set(pageWidths(await res.body()))).toEqual(new Set([612]));
});

test("the print page shows what the recipient sees", async ({ page, user }) => {
  const board = await createTestBoard(user.id, { messagesVisible: false });
  await insertMessages(board.id, [
    { author: "Priya", body: "Happy **birthday**!" },
    { author: "Sam", body: "See you Saturday" },
    { author: "Troll", body: "Hidden by the owner", hidden: true },
  ]);
  await page.goto(`/board/${board.revealSlug}/print?paper=letter`);
  await expect(
    page.getByRole("heading", { name: "Happy Birthday, Maya!" }),
  ).toBeVisible();
  await expect(page.getByText("For Maya")).toBeVisible();
  await expect(page.locator("[data-print-ready]")).toBeAttached();
  await expect(page.getByRole("article")).toHaveCount(2);
  await expect(page.getByText("Hidden by the owner")).toHaveCount(0);
});

test("only the reveal link can download the PDF", async ({ request, user }) => {
  const board = await createTestBoard(user.id);
  // The contribute link must not leak a surprise-mode board's messages.
  const res = await request.get(`/board/${board.shareSlug}/pdf`);
  expect(res.status()).toBe(404);
  expect((await request.get("/board/not-a-slug/pdf")).status()).toBe(404);
});
