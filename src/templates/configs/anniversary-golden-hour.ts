import { defineTemplate } from "../types";

export default defineTemplate({
  id: "anniversary-golden-hour",
  name: "Golden Hour",
  occasion: "ANNIVERSARY",
  description: "Classic cream and gold with elegant serif type.",
  fonts: { heading: "cormorant", body: "lora" },
  colors: {
    background: "#fbf5ea",
    backgroundImage: "linear-gradient(180deg, #fffaf0 0%, #f5e9d3 100%)",
    heading: "#7c5a1e",
    text: "#3f2d0c",
    accent: "#8a6420",
    accentText: "#ffffff",
  },
  cards: {
    style: "paper",
    radius: 4,
    palette: {
      c1: { label: "Ivory", background: "#fffdf7", text: "#3f2d0c" },
      c2: { label: "Champagne", background: "#f7e7c6", text: "#3f2d0c" },
      c3: { label: "Rose gold", background: "#f6d5cb", text: "#4a1d12" },
      c4: { label: "Sage", background: "#e3ead8", text: "#1f2e14" },
      c5: { label: "Pearl", background: "#eeeae4", text: "#292524" },
      c6: { label: "Blush", background: "#f9e1e4", text: "#4c0519" },
    },
    defaultColor: "c1",
  },
  decoration: "sparkles",
  entrance: "fade-up",
  opener: "envelope",
});
