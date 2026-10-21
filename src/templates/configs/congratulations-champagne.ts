import { defineTemplate } from "../types";

export default defineTemplate({
  id: "congratulations-champagne",
  name: "Champagne Toast",
  occasion: "CONGRATULATIONS",
  description: "Pale gold and rising bubbles: raise a glass to their big news.",
  fonts: { heading: "dmSerif", body: "quicksand" },
  colors: {
    background: "#fffbeb",
    backgroundImage:
      "radial-gradient(ellipse at bottom, #fde68a 0%, transparent 60%), linear-gradient(to bottom, #fffbeb, #fef3c7)",
    heading: "#92400e",
    text: "#451a03",
    accent: "#92400e",
    accentText: "#ffffff",
  },
  cards: {
    style: "polaroid",
    radius: 4,
    palette: {
      c1: { label: "Brut", background: "#fef3c7", text: "#451a03" },
      c2: { label: "Rosé", background: "#fce7f3", text: "#500724" },
      c3: { label: "Sparkle", background: "#ffffff", text: "#1c1917" },
      c4: { label: "Gold", background: "#fde68a", text: "#422006" },
      c5: { label: "Cork", background: "#e7d3b1", text: "#3b2410" },
      c6: { label: "Bottle", background: "#14532d", text: "#fefce8" },
    },
    defaultColor: "c3",
  },
  decoration: "bubbles",
  entrance: "flip",
  opener: "envelope",
});
