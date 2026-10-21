import { describe, expect, it } from "vitest";
import { parseRichText, toPlainText } from "@/lib/rich-text";

describe("parseRichText", () => {
  it("parses bold and italic", () => {
    expect(parseRichText("Happy **birthday** to _you_!")).toEqual([
      [
        { text: "Happy " },
        { text: "birthday", bold: true },
        { text: " to " },
        { text: "you", italic: true },
        { text: "!" },
      ],
    ]);
  });

  it("splits lines", () => {
    expect(parseRichText("one\n\ntwo")).toEqual([
      [{ text: "one" }],
      [],
      [{ text: "two" }],
    ]);
  });

  it("leaves snake_case and unmatched markers alone", () => {
    expect(parseRichText("my_var_name and **open")).toEqual([
      [{ text: "my_var_name and **open" }],
    ]);
  });

  it("does not span markers across lines", () => {
    expect(parseRichText("**a\nb**")).toEqual([
      [{ text: "**a" }],
      [{ text: "b**" }],
    ]);
  });

  it("keeps HTML as literal text", () => {
    expect(parseRichText("<img src=x onerror=alert(1)>")).toEqual([
      [{ text: "<img src=x onerror=alert(1)>" }],
    ]);
  });

  it("handles emoji and non-Latin text", () => {
    expect(parseRichText("🎉 **Félicitations** _नमस्ते_")).toEqual([
      [
        { text: "🎉 " },
        { text: "Félicitations", bold: true },
        { text: " " },
        { text: "नमस्ते", italic: true },
      ],
    ]);
  });
});

describe("toPlainText", () => {
  it("strips markers", () => {
    expect(toPlainText("**Hi** _there_\nfriend")).toBe("Hi there\nfriend");
  });
});
