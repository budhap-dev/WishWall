import { defineTemplate } from "../types";

export default defineTemplate({
  id: "anniversary-moonlit-waltz",
  name: "Moonlit Waltz",
  occasion: "ANNIVERSARY",
  description:
    "Velvet burgundy and gold under the stars, for a night to remember.",
  fonts: { heading: "playfair", body: "lora" },
  colors: {
    background: "#2a0a18",
    backgroundImage:
      "radial-gradient(#fcd34d33 1px, transparent 1.5px), radial-gradient(ellipse at top, #7f1d1d 0%, transparent 60%)",
    backgroundSize: "34px 34px, 100% 100%",
    heading: "#fcd34d",
    text: "#fce7f3",
    accent: "#fcd34d",
    accentText: "#2a0a18",
  },
  cards: {
    style: "glass",
    radius: 10,
    palette: {
      c1: { label: "Ivory", background: "#fffbeb", text: "#451a03" },
      c2: { label: "Blush", background: "#fce7f3", text: "#500724" },
      c3: { label: "Champagne", background: "#fef3c7", text: "#422006" },
      c4: { label: "Lilac", background: "#f3e8ff", text: "#3b0764" },
      c5: { label: "Rosewood", background: "#fecdd3", text: "#4c0519" },
      c6: { label: "Pearl", background: "#f8fafc", text: "#1e293b" },
    },
    defaultColor: "c1",
  },
  decoration: "stars",
  entrance: "flip",
  opener: "curtain",
});
