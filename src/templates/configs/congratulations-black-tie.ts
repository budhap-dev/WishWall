import { defineTemplate } from "../types";

export default defineTemplate({
  id: "congratulations-black-tie",
  name: "Black Tie",
  occasion: "CONGRATULATIONS",
  description: "Black and gold, for a big achievement.",
  fonts: { heading: "playfair", body: "quicksand" },
  colors: {
    background: "#111111",
    backgroundImage:
      "radial-gradient(ellipse at top, #3f3f46 0%, transparent 60%)",
    heading: "#e7c76a",
    text: "#f5f5f4",
    accent: "#d4af37",
    accentText: "#111111",
  },
  cards: {
    style: "outline",
    radius: 2,
    palette: {
      c1: { label: "Ivory", background: "#fafaf9", text: "#1c1917" },
      c2: { label: "Gold leaf", background: "#f5e7b8", text: "#3b2a05" },
      c3: { label: "Silver", background: "#e7e5e4", text: "#1c1917" },
      c4: { label: "Champagne", background: "#fdf4e3", text: "#3f2d0c" },
      c5: { label: "Bronze", background: "#f1d6c0", text: "#3b1d0a" },
      c6: { label: "Platinum", background: "#f1f5f9", text: "#0f172a" },
    },
    defaultColor: "c1",
  },
  decoration: "confetti",
  entrance: "pop",
  opener: "gift-box",
});
