import { describe, expect, it } from "vitest";
import { generateSlug, isValidSlug } from "@/lib/slug";

describe("generateSlug", () => {
  it("produces 32 URL-safe characters", () => {
    const slug = generateSlug();
    expect(slug).toHaveLength(32);
    expect(isValidSlug(slug)).toBe(true);
  });

  it("does not repeat", () => {
    const slugs = new Set(Array.from({ length: 1000 }, generateSlug));
    expect(slugs.size).toBe(1000);
  });
});

describe("isValidSlug", () => {
  it.each([
    "",
    "short",
    "a".repeat(33),
    "has spaces in it padded to 32 ch",
    "../../etc/passwd/xxxxxxxxxxxxxxx",
  ])("rejects %j", (value) => {
    expect(isValidSlug(value)).toBe(false);
  });
});
