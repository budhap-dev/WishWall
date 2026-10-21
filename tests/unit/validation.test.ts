import { describe, expect, it } from "vitest";
import {
  boardAppearanceSchema,
  createBoardSchema,
} from "@/lib/validation/board";
import { optionalDate } from "@/lib/validation/common";
import { safeRedirectPath } from "@/lib/safe-redirect";

const valid = {
  recipientName: "  Maya  ",
  occasion: "BIRTHDAY",
  templateId: "birthday-confetti-pop",
  title: "Happy   Birthday,\nMaya!",
  intro: "",
  eventDate: "",
  allowGuests: true,
  messagesVisible: true,
};

describe("createBoardSchema", () => {
  it("normalises text fields", () => {
    const data = createBoardSchema.parse(valid);
    expect(data.recipientName).toBe("Maya");
    expect(data.title).toBe("Happy Birthday, Maya!");
    expect(data.intro).toBeNull();
    expect(data.eventDate).toBeNull();
  });

  it("strips control characters and squashes blank lines in the intro", () => {
    const data = createBoardSchema.parse({
      ...valid,
      intro: "Hi\u0007 all\r\n\r\n\r\n\r\nLove, J",
    });
    expect(data.intro).toBe("Hi all\n\nLove, J");
  });

  it("rejects a template from another occasion", () => {
    const result = createBoardSchema.safeParse({
      ...valid,
      templateId: "farewell-bon-voyage",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["templateId"]);
  });

  it("rejects unknown templates and occasions", () => {
    expect(
      createBoardSchema.safeParse({ ...valid, templateId: "nope" }).success,
    ).toBe(false);
    expect(
      createBoardSchema.safeParse({ ...valid, occasion: "HALLOWEEN" }).success,
    ).toBe(false);
  });

  it("enforces length limits", () => {
    expect(
      createBoardSchema.safeParse({ ...valid, recipientName: "   " }).success,
    ).toBe(false);
    expect(
      createBoardSchema.safeParse({ ...valid, title: "x".repeat(121) }).success,
    ).toBe(false);
    expect(
      createBoardSchema.safeParse({ ...valid, intro: "x".repeat(1001) })
        .success,
    ).toBe(false);
  });

  it("rejects wrong types from a tampered client", () => {
    expect(
      createBoardSchema.safeParse({ ...valid, allowGuests: "yes" }).success,
    ).toBe(false);
    expect(createBoardSchema.safeParse(null).success).toBe(false);
  });
});

describe("boardAppearanceSchema", () => {
  it("accepts a matching occasion/template pair", () => {
    expect(
      boardAppearanceSchema.safeParse({
        occasion: "WELCOME",
        templateId: "welcome-open-door",
      }).success,
    ).toBe(true);
  });
});

describe("optionalDate", () => {
  it("parses YYYY-MM-DD as UTC midnight", () => {
    expect(optionalDate.parse("2026-12-25")?.toISOString()).toBe(
      "2026-12-25T00:00:00.000Z",
    );
  });

  it.each(["25/12/2026", "2026-13-01", "1800-01-01", "tomorrow"])(
    "rejects %j",
    (value) => {
      expect(optionalDate.safeParse(value).success).toBe(false);
    },
  );
});

describe("safeRedirectPath", () => {
  it.each([
    ["/dashboard/boards/abc?x=1", "/dashboard/boards/abc?x=1"],
    ["/", "/"],
  ])("allows %j", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "dashboard",
    undefined,
    42,
  ])("rejects %j", (input) => {
    expect(safeRedirectPath(input)).toBe("/dashboard");
  });
});
