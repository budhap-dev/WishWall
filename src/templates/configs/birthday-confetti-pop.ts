import { defineTemplate } from "../types";

export default defineTemplate({
  id: "birthday-confetti-pop",
  name: "Confetti Pop",
  occasion: "BIRTHDAY",
  description: "Bright, playful sticky notes with a burst of confetti.",
  fonts: { heading: "pacifico", body: "nunito" },
  colors: {
    background: "#fff7ed",
    backgroundImage:
      "radial-gradient(circle at 12% 18%, #fdba7480 0 6px, transparent 7px), radial-gradient(circle at 78% 12%, #f9a8d480 0 5px, transparent 6px), radial-gradient(circle at 88% 72%, #93c5fd80 0 7px, transparent 8px), radial-gradient(circle at 22% 82%, #86efac80 0 5px, transparent 6px)",
    heading: "#c2410c",
    text: "#431407",
    accent: "#c2410c",
    accentText: "#ffffff",
  },
  cards: {
    style: "sticky",
    radius: 6,
    palette: {
      c1: { label: "Tangerine", background: "#fed7aa", text: "#431407" },
      c2: { label: "Bubblegum", background: "#fbcfe8", text: "#500724" },
      c3: { label: "Sky", background: "#bfdbfe", text: "#172554" },
      c4: { label: "Lime", background: "#d9f99d", text: "#1a2e05" },
      c5: { label: "Lemon", background: "#fef08a", text: "#422006" },
      c6: { label: "Grape", background: "#e9d5ff", text: "#3b0764" },
    },
    defaultColor: "c5",
  },
  decoration: "confetti",
  entrance: "pop",
  opener: "gift-box",
});
