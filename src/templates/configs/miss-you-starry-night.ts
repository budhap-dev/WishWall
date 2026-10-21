import { defineTemplate } from "../types";

export default defineTemplate({
  id: "miss-you-starry-night",
  name: "Starry Night",
  occasion: "MISS_YOU",
  description: "Same sky, wherever you are: deep blue with twinkling stars.",
  fonts: { heading: "fraunces", body: "quicksand" },
  colors: {
    background: "#0f172a",
    backgroundImage:
      "radial-gradient(#ffffff40 1px, transparent 1px), radial-gradient(ellipse at top, #1e3a8a 0%, transparent 65%)",
    backgroundSize: "28px 28px, 100% 100%",
    heading: "#fde68a",
    text: "#e2e8f0",
    accent: "#fbbf24",
    accentText: "#0f172a",
  },
  cards: {
    style: "glass",
    radius: 14,
    palette: {
      c1: { label: "Starlight", background: "#f8fafc", text: "#0f172a" },
      c2: { label: "Moon", background: "#fef9c3", text: "#422006" },
      c3: { label: "Nebula", background: "#ede9fe", text: "#2e1065" },
      c4: { label: "Aurora", background: "#ccfbf1", text: "#042f2e" },
      c5: { label: "Dawn", background: "#ffe4e6", text: "#4c0519" },
      c6: { label: "Ice", background: "#e0f2fe", text: "#082f49" },
    },
    defaultColor: "c1",
  },
  decoration: "stars",
  entrance: "float",
  opener: "envelope",
});
