import { defineTemplate } from "../types";

export default defineTemplate({
  id: "welcome-all-aboard",
  name: "All Aboard",
  occasion: "WELCOME",
  description:
    "Crisp navy stripes and coral flags for welcoming someone to the crew.",
  fonts: { heading: "baloo", body: "nunito" },
  colors: {
    background: "#f8fafc",
    backgroundImage:
      "repeating-linear-gradient(0deg, #1e3a8a14 0 14px, transparent 14px 42px)",
    heading: "#1e3a8a",
    text: "#0f172a",
    accent: "#e11d48",
    accentText: "#ffffff",
  },
  cards: {
    style: "paper",
    radius: 12,
    palette: {
      c1: { label: "Sail", background: "#ffffff", text: "#0f172a" },
      c2: { label: "Navy", background: "#1e3a8a", text: "#f8fafc" },
      c3: { label: "Coral", background: "#ffe4e6", text: "#4c0519" },
      c4: { label: "Sea", background: "#cffafe", text: "#083344" },
      c5: { label: "Sand", background: "#fef3c7", text: "#451a03" },
      c6: { label: "Buoy", background: "#fed7aa", text: "#431407" },
    },
    defaultColor: "c1",
  },
  decoration: "streamers",
  entrance: "flip",
  opener: "gift-box",
});
