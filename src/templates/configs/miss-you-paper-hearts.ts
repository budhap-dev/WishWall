import { defineTemplate } from "../types";

export default defineTemplate({
  id: "miss-you-paper-hearts",
  name: "Paper Hearts",
  occasion: "MISS_YOU",
  description: "Handwritten notes and little hearts, like a scrapbook.",
  fonts: { heading: "caveat", body: "patrickHand" },
  colors: {
    background: "#fff5f7",
    backgroundImage:
      "repeating-linear-gradient(0deg, transparent 0 27px, #fecdd355 27px 28px)",
    heading: "#be123c",
    text: "#4c0519",
    accent: "#e11d48",
    accentText: "#ffffff",
  },
  cards: {
    style: "sticky",
    radius: 4,
    palette: {
      c1: { label: "Rose", background: "#ffe4e6", text: "#4c0519" },
      c2: { label: "Butter", background: "#fef9c3", text: "#422006" },
      c3: { label: "Powder", background: "#dbeafe", text: "#172554" },
      c4: { label: "Mint", background: "#dcfce7", text: "#052e16" },
      c5: { label: "Lilac", background: "#f3e8ff", text: "#3b0764" },
      c6: { label: "Peach", background: "#ffedd5", text: "#431407" },
    },
    defaultColor: "c1",
  },
  decoration: "hearts",
  entrance: "drop",
  opener: "envelope",
});
