import { defineTemplate } from "../types";

export default defineTemplate({
  id: "get-well-sunny-days",
  name: "Sunny Days",
  occasion: "GET_WELL_SOON",
  description: "Cheerful sunshine yellow to brighten their day.",
  fonts: { heading: "baloo", body: "quicksand" },
  colors: {
    background: "#fefce8",
    backgroundImage:
      "radial-gradient(circle at 85% 10%, #fde04799 0%, transparent 30%)",
    heading: "#854d0e",
    text: "#422006",
    accent: "#a16207",
    accentText: "#ffffff",
  },
  cards: {
    style: "paper",
    radius: 16,
    palette: {
      c1: { label: "Sunbeam", background: "#fef9c3", text: "#422006" },
      c2: { label: "Daisy", background: "#ffffff", text: "#1c1917" },
      c3: { label: "Sky", background: "#e0f2fe", text: "#082f49" },
      c4: { label: "Meadow", background: "#dcfce7", text: "#052e16" },
      c5: { label: "Peach", background: "#ffedd5", text: "#431407" },
      c6: { label: "Lavender", background: "#f3e8ff", text: "#3b0764" },
    },
    defaultColor: "c1",
  },
  decoration: "sparkles",
  entrance: "float",
  opener: "envelope",
});
