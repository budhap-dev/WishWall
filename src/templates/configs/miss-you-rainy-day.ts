import { defineTemplate } from "../types";

export default defineTemplate({
  id: "miss-you-rainy-day",
  name: "Rainy Day",
  occasion: "MISS_YOU",
  description:
    "Soft grey-blue skies and raindrops: cosy notes for missing someone.",
  fonts: { heading: "dancing", body: "quicksand" },
  colors: {
    background: "#e2e8f0",
    backgroundImage:
      "linear-gradient(100deg, transparent 49%, #94a3b84d 49% 51%, transparent 51%), linear-gradient(to bottom, #cbd5e1 0%, #e2e8f0 60%)",
    backgroundSize: "22px 44px, 100% 100%",
    heading: "#1e3a8a",
    text: "#0f172a",
    accent: "#1e40af",
    accentText: "#ffffff",
  },
  cards: {
    style: "paper",
    radius: 16,
    palette: {
      c1: { label: "Cloud", background: "#f8fafc", text: "#0f172a" },
      c2: { label: "Puddle", background: "#dbeafe", text: "#172554" },
      c3: { label: "Umbrella", background: "#fef08a", text: "#422006" },
      c4: { label: "Tea", background: "#fde68a", text: "#451a03" },
      c5: { label: "Wellies", background: "#fecaca", text: "#450a0a" },
      c6: { label: "Moss", background: "#d9f99d", text: "#1a2e05" },
    },
    defaultColor: "c1",
  },
  decoration: "bubbles",
  entrance: "fade-up",
  opener: "curtain",
});
