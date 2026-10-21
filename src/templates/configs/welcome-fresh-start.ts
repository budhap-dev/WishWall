import { defineTemplate } from "../types";

export default defineTemplate({
  id: "welcome-fresh-start",
  name: "Fresh Start",
  occasion: "WELCOME",
  description: "Crisp mint and handwritten hellos.",
  fonts: { heading: "caveat", body: "quicksand" },
  colors: {
    background: "#ecfdf5",
    backgroundImage:
      "linear-gradient(90deg, #a7f3d033 1px, transparent 1px), linear-gradient(0deg, #a7f3d033 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    heading: "#065f46",
    text: "#022c22",
    accent: "#047857",
    accentText: "#ffffff",
  },
  cards: {
    style: "sticky",
    radius: 6,
    palette: {
      c1: { label: "Mint", background: "#d1fae5", text: "#022c22" },
      c2: { label: "Lemon", background: "#fef9c3", text: "#422006" },
      c3: { label: "Sky", background: "#e0f2fe", text: "#082f49" },
      c4: { label: "Peach", background: "#ffedd5", text: "#431407" },
      c5: { label: "Lilac", background: "#f3e8ff", text: "#3b0764" },
      c6: { label: "Paper", background: "#ffffff", text: "#1c1917" },
    },
    defaultColor: "c1",
  },
  decoration: "bubbles",
  entrance: "pop",
  opener: "envelope",
});
