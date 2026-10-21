import { defineTemplate } from "../types";

export default defineTemplate({
  id: "congratulations-hooray",
  name: "Hooray!",
  occasion: "CONGRATULATIONS",
  description: "Loud, happy colours and streamers everywhere.",
  fonts: { heading: "lobster", body: "nunito" },
  colors: {
    background: "#ecfeff",
    backgroundImage:
      "linear-gradient(135deg, #cffafe55 25%, transparent 25% 50%, #cffafe55 50% 75%, transparent 75%)",
    backgroundSize: "48px 48px",
    heading: "#6d28d9",
    text: "#2e1065",
    accent: "#7c3aed",
    accentText: "#ffffff",
  },
  cards: {
    style: "sticky",
    radius: 8,
    palette: {
      c1: { label: "Violet", background: "#ddd6fe", text: "#2e1065" },
      c2: { label: "Cyan", background: "#a5f3fc", text: "#083344" },
      c3: { label: "Hot pink", background: "#fbcfe8", text: "#500724" },
      c4: { label: "Sunshine", background: "#fde68a", text: "#451a03" },
      c5: { label: "Lime", background: "#bef264", text: "#1a2e05" },
      c6: { label: "Orange", background: "#fdba74", text: "#431407" },
    },
    defaultColor: "c1",
  },
  decoration: "streamers",
  entrance: "pop",
  opener: "curtain",
});
