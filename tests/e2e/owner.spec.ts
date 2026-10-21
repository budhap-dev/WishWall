import { randomBytes } from "node:crypto";
import { test as anonymous } from "@playwright/test";
import { expect, test, withDb } from "./fixtures";

anonymous(
  "signed-out visitors are sent to sign-in and back",
  async ({ page }) => {
    await page.goto("/dashboard/new");
    await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Fdashboard%2Fnew/);
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
  },
);

test("create a board with the wizard, then manage it", async ({
  page,
  user,
  isMobile,
}) => {
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "No boards yet" }),
  ).toBeVisible();

  // The header shows who's signed in (in the side panel on small screens).
  await page
    .getByRole("button", { name: isMobile ? "Open menu" : "Account menu" })
    .click();
  await expect(page.getByRole(isMobile ? "dialog" : "menu")).toContainText(
    user.email,
  );
  await page.keyboard.press("Escape");

  await page.getByRole("link", { name: "Create your first board" }).click();

  // Step 1: recipient. Submitting empty shows a validation error.
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Recipient name is required")).toBeVisible();
  await page.getByLabel("Recipient's name").fill("Maya");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 2: occasion (radio cards).
  await expect(
    page.getByRole("heading", { name: "What are we celebrating with Maya?" }),
  ).toBeFocused();
  await page.getByRole("radio", { name: /Farewell/ }).check({ force: true });
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 3: template, defaulted to the first farewell template; pick the second.
  await expect(page.getByRole("radio", { name: /Bon Voyage/ })).toBeChecked();
  await page.getByRole("radio", { name: /Sunset Road/ }).check({ force: true });
  await expect(page.getByLabel("Live preview")).toContainText(
    "We'll miss you, Maya!",
  );
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Step 4: details, with the title suggested from the occasion.
  await expect(page.getByLabel("Board title")).toHaveValue(
    "We'll miss you, Maya!",
  );
  await page
    .getByLabel("Intro message (optional)")
    .fill("Sign the card before Friday!");
  await page.getByLabel("Event date (optional)").fill("2026-12-18");
  await page.getByRole("button", { name: "Create board" }).click();

  // Owner dashboard for the new board.
  await expect(page).toHaveURL(/\/dashboard\/boards\/\w+\?created=1/);
  await expect(page.getByText("Your board is ready!")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "We'll miss you, Maya!",
  );
  await expect(page.getByText("Farewell for Maya · 18 Dec 2026")).toBeVisible();

  const contribute = page.getByLabel("Contribute link", { exact: true });
  const recipient = page.getByLabel("Recipient link", { exact: true });
  await expect(contribute).toHaveValue(/\/board\/[\w-]{32}$/);
  await expect(recipient).toHaveValue(/\/board\/[\w-]{32}\/reveal$/);

  // Regenerate the contribute link: the URL changes, the recipient link doesn't.
  const oldContribute = await contribute.inputValue();
  const oldRecipient = await recipient.inputValue();
  await page.getByRole("button", { name: "New link" }).first().click();
  await page.getByRole("button", { name: "Replace link" }).click();
  await expect(contribute).not.toHaveValue(oldContribute);
  await expect(recipient).toHaveValue(oldRecipient);

  // Edit details.
  await page.getByLabel("Board title").fill("Bon voyage, Maya!");
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByText("Board details saved")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Bon voyage, Maya!",
  );

  // Change template.
  await page.getByRole("radio", { name: /Bon Voyage/ }).check({ force: true });
  await page.getByRole("button", { name: "Save template" }).click();
  await expect(page.getByText("Template updated")).toBeVisible();

  // Close, then reopen.
  await page.getByRole("button", { name: "Close board" }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Close board" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Closed to new messages" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reopen" }).click();
  await expect(
    page.getByRole("heading", { name: "Accepting messages" }),
  ).toBeVisible();

  // The board shows up in the list.
  await page.getByRole("link", { name: "My boards" }).first().click();
  await expect(
    page.getByRole("link", { name: /Bon voyage, Maya!/ }),
  ).toBeVisible();

  // Delete it.
  await page.getByRole("link", { name: /Bon voyage, Maya!/ }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete forever" }).click();
  await expect(page).toHaveURL(/\/dashboard\?deleted=1/);
  await expect(page.getByText("Board deleted.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No boards yet" }),
  ).toBeVisible();
});

test("another user's board is a 404", async ({ page, user }) => {
  // A board owned by someone else must be indistinguishable from a missing one.
  const otherId = `e2eother${randomBytes(6).toString("hex")}`;
  const boardId = `e2eboard${randomBytes(8).toString("hex")}`;
  await withDb(async (db) => {
    await db.query(
      `INSERT INTO "User" (id, name, "createdAt", "updatedAt") VALUES ($1, 'Someone Else', now(), now())`,
      [otherId],
    );
    await db.query(
      `INSERT INTO "Board" (id, "ownerId", "shareSlug", "revealSlug", "recipientName", occasion,
         title, "templateId", "updatedAt")
       VALUES ($1, $2, $3, $4, 'Sam', 'BIRTHDAY', 'Not yours', 'birthday-confetti-pop', now())`,
      [
        boardId,
        otherId,
        randomBytes(24).toString("base64url"),
        randomBytes(24).toString("base64url"),
      ],
    );
  });

  try {
    // (The HTTP status is 200 because the page shell streams before the
    // ownership check runs; what matters is that nothing leaks.)
    await page.goto(`/dashboard/boards/${boardId}`);
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await expect(page.getByText("Not yours")).toHaveCount(0);

    // Our own (empty) dashboard doesn't list it either.
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "No boards yet" }),
    ).toBeVisible();
    expect(user.id).not.toBe(otherId);
  } finally {
    await withDb((db) =>
      db.query(`DELETE FROM "User" WHERE id = $1`, [otherId]),
    );
  }
});
