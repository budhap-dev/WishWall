import { describe, expect, it } from "vitest";
import { isTextColorReadable, TEXT_COLOR_IDS } from "@/lib/message-style";
import { messageContentSchema } from "@/lib/validation/message";
import { getTemplate, TEMPLATES } from "@/templates";

const confetti = getTemplate("birthday-confetti-pop")!; // light pastel cards
const base = { authorName: "Ann", body: "Hi", cardColor: "c1", image: null };

describe("message styling options", () => {
  it("allows dark colours on light cards but not white", () => {
    expect(isTextColorReadable(confetti, "c1", "black")).toBe(true);
    expect(isTextColorReadable(confetti, "c1", "blue")).toBe(true);
    expect(isTextColorReadable(confetti, "c1", "white")).toBe(false);
  });

  it("offers at least one readable non-default colour on every card of every template", () => {
    for (const t of TEMPLATES) {
      for (const card of ["c1", "c2", "c3", "c4", "c5", "c6"]) {
        expect(
          TEXT_COLOR_IDS.some((id) => isTextColorReadable(t, card, id)),
          `${t.id}/${card}`,
        ).toBe(true);
      }
    }
  });
});

describe("messageContentSchema styling fields", () => {
  it("defaults to the template's font and colour", () => {
    const data = messageContentSchema.parse(base);
    expect(data).toMatchObject({ font: null, textColor: null });
  });

  it("accepts known ids and rejects anything else", () => {
    expect(
      messageContentSchema.parse({
        ...base,
        font: "handwritten",
        textColor: "blue",
      }),
    ).toMatchObject({
      font: "handwritten",
      textColor: "blue",
    });
    expect(
      messageContentSchema.safeParse({ ...base, font: "Comic Sans" }).success,
    ).toBe(false);
    expect(
      messageContentSchema.safeParse({ ...base, textColor: "#ff0000" }).success,
    ).toBe(false);
  });
});
