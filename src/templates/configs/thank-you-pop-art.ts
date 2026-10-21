import { defineTemplate } from "../types";

export default defineTemplate({
  id: "thank-you-pop-art",
  name: "Pop Art",
  occasion: "THANK_YOU",
  description: "Bold comic-book colours with halftone dots.",
  fonts: { heading: "dmSerif", body: "nunito" },
  colors: {
    background: "#fef3c7",
    backgroundImage: "radial-gradient(#f472b655 2px, transparent 2px)",
    backgroundSize: "14px 14px",
    heading: "#9d174d",
    text: "#1c1917",
    accent: "#be185d",
    accentText: "#ffffff",
  },
  cards: {
    style: "outline",
    radius: 0,
    palette: {
      c1: { label: "White", background: "#ffffff", text: "#1c1917" },
      c2: { label: "Pop pink", background: "#fbcfe8", text: "#500724" },
      c3: { label: "Electric", background: "#bfdbfe", text: "#172554" },
      c4: { label: "Zap", background: "#fde047", text: "#422006" },
      c5: { label: "Mint", background: "#a7f3d0", text: "#022c22" },
      c6: { label: "Tangerine", background: "#fdba74", text: "#431407" },
    },
    defaultColor: "c1",
  },
  decoration: "sparkles",
  entrance: "pop",
  opener: "gift-box",
});
