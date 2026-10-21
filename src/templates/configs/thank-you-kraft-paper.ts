import { defineTemplate } from "../types";

export default defineTemplate({
  id: "thank-you-kraft-paper",
  name: "Kraft Paper",
  occasion: "THANK_YOU",
  description:
    "Brown kraft paper and handwritten thank-yous, like a parcel tied with string.",
  fonts: { heading: "caveat", body: "patrickHand" },
  colors: {
    background: "#c8a97e",
    backgroundImage:
      "repeating-linear-gradient(0deg, #00000008 0 2px, transparent 2px 5px), repeating-linear-gradient(90deg, #ffffff0d 0 3px, transparent 3px 7px)",
    heading: "#3b2410",
    text: "#2a1a0b",
    accent: "#3b2410",
    accentText: "#fdf6e3",
  },
  cards: {
    style: "polaroid",
    radius: 2,
    palette: {
      c1: { label: "Cream", background: "#fdf6e3", text: "#2a1a0b" },
      c2: { label: "Twine", background: "#f5e6c8", text: "#3b2410" },
      c3: { label: "Sage", background: "#dcfce7", text: "#052e16" },
      c4: { label: "Rose", background: "#ffe4e6", text: "#4c0519" },
      c5: { label: "Sky", background: "#e0f2fe", text: "#082f49" },
      c6: { label: "Ink", background: "#292524", text: "#fafaf9" },
    },
    defaultColor: "c1",
  },
  decoration: "hearts",
  entrance: "drop",
  opener: "envelope",
});
