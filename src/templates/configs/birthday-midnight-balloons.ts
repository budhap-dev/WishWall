import { defineTemplate } from "../types";

export default defineTemplate({
  id: "birthday-midnight-balloons",
  name: "Midnight Balloons",
  occasion: "BIRTHDAY",
  description: "A night-sky party with glowing cards and floating balloons.",
  fonts: { heading: "baloo", body: "nunito" },
  colors: {
    background: "#1e1b4b",
    backgroundImage:
      "radial-gradient(ellipse at top, #4338ca 0%, transparent 60%), radial-gradient(ellipse at bottom right, #7e22ce 0%, transparent 55%)",
    heading: "#fde68a",
    text: "#e0e7ff",
    accent: "#facc15",
    accentText: "#1e1b4b",
  },
  cards: {
    style: "glass",
    radius: 18,
    palette: {
      c1: { label: "Moonlight", background: "#eef2ff", text: "#1e1b4b" },
      c2: { label: "Candy", background: "#fce7f3", text: "#500724" },
      c3: { label: "Gold", background: "#fef3c7", text: "#451a03" },
      c4: { label: "Aqua", background: "#cffafe", text: "#083344" },
      c5: { label: "Lavender", background: "#ede9fe", text: "#2e1065" },
      c6: { label: "Mint", background: "#d1fae5", text: "#022c22" },
    },
    defaultColor: "c1",
  },
  decoration: "balloons",
  entrance: "float",
  opener: "gift-box",
});
