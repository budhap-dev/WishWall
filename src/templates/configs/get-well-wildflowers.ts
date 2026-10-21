import { defineTemplate } from "../types";

export default defineTemplate({
  id: "get-well-wildflowers",
  name: "Wildflowers",
  occasion: "GET_WELL_SOON",
  description: "A hand-picked bouquet of soft greens and petals.",
  fonts: { heading: "amatic", body: "patrickHand" },
  colors: {
    background: "#f0fdf4",
    backgroundImage:
      "radial-gradient(circle at 10% 90%, #bbf7d0 0%, transparent 35%), radial-gradient(circle at 90% 15%, #fce7f3 0%, transparent 30%)",
    heading: "#166534",
    text: "#052e16",
    accent: "#15803d",
    accentText: "#ffffff",
  },
  cards: {
    style: "paper",
    radius: 6,
    palette: {
      c1: { label: "Leaf", background: "#dcfce7", text: "#052e16" },
      c2: { label: "Poppy", background: "#ffe4e6", text: "#4c0519" },
      c3: { label: "Buttercup", background: "#fef9c3", text: "#422006" },
      c4: { label: "Cornflower", background: "#dbeafe", text: "#172554" },
      c5: { label: "Heather", background: "#f3e8ff", text: "#3b0764" },
      c6: { label: "Linen", background: "#fafaf9", text: "#1c1917" },
    },
    defaultColor: "c1",
  },
  decoration: "petals",
  entrance: "drop",
  opener: "envelope",
});
