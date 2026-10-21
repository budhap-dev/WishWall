import { defineTemplate } from "../types";

export default defineTemplate({
  id: "thank-you-botanical",
  name: "Botanical",
  occasion: "THANK_YOU",
  description: "Calm sage and linen with drifting leaves.",
  fonts: { heading: "cormorant", body: "lora" },
  colors: {
    background: "#f4f4ee",
    backgroundImage: "linear-gradient(180deg, #f7f7f2 0%, #e6ebdc 100%)",
    heading: "#3f6212",
    text: "#1a2e05",
    accent: "#4d7c0f",
    accentText: "#ffffff",
  },
  cards: {
    style: "paper",
    radius: 4,
    palette: {
      c1: { label: "Linen", background: "#fffefa", text: "#1c1917" },
      c2: { label: "Sage", background: "#e3ead8", text: "#1f2e14" },
      c3: { label: "Clay", background: "#f3e2d5", text: "#3b1d0a" },
      c4: { label: "Eucalyptus", background: "#d5e8e0", text: "#042f2e" },
      c5: { label: "Oat", background: "#f1ead9", text: "#3f2d0c" },
      c6: { label: "Fern", background: "#d9f0c4", text: "#1a2e05" },
    },
    defaultColor: "c1",
  },
  decoration: "leaves",
  entrance: "fade-up",
  opener: "envelope",
});
