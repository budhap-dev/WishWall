import { defineTemplate } from "../types";

export default defineTemplate({
  id: "anniversary-rose-garden",
  name: "Rose Garden",
  occasion: "ANNIVERSARY",
  description: "Romantic blush tones, script lettering and drifting petals.",
  fonts: { heading: "dancing", body: "lora" },
  colors: {
    background: "#fdf2f4",
    backgroundImage:
      "radial-gradient(circle at 0% 0%, #fecdd3 0%, transparent 40%), radial-gradient(circle at 100% 100%, #fbcfe8 0%, transparent 45%)",
    heading: "#9f1239",
    text: "#4c0519",
    accent: "#be185d",
    accentText: "#ffffff",
  },
  cards: {
    style: "polaroid",
    radius: 2,
    palette: {
      c1: { label: "Petal", background: "#fff1f2", text: "#4c0519" },
      c2: { label: "Peony", background: "#fce7f3", text: "#500724" },
      c3: { label: "Cream", background: "#fffbeb", text: "#451a03" },
      c4: { label: "Lilac", background: "#f3e8ff", text: "#3b0764" },
      c5: { label: "Coral", background: "#ffe4e6", text: "#4c0519" },
      c6: { label: "Ivory", background: "#ffffff", text: "#1c1917" },
    },
    defaultColor: "c1",
  },
  decoration: "petals",
  entrance: "drop",
  opener: "envelope",
});
