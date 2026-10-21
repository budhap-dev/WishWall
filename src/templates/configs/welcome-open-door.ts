import { defineTemplate } from "../types";

export default defineTemplate({
  id: "welcome-open-door",
  name: "Open Door",
  occasion: "WELCOME",
  description: "Friendly indigo and snapshots of a warm welcome.",
  fonts: { heading: "fraunces", body: "nunito" },
  colors: {
    background: "#eef2ff",
    backgroundImage:
      "radial-gradient(circle at 50% -20%, #c7d2fe 0%, transparent 60%)",
    heading: "#3730a3",
    text: "#1e1b4b",
    accent: "#4338ca",
    accentText: "#ffffff",
  },
  cards: {
    style: "polaroid",
    radius: 4,
    palette: {
      c1: { label: "Snow", background: "#ffffff", text: "#1e1b4b" },
      c2: { label: "Periwinkle", background: "#e0e7ff", text: "#1e1b4b" },
      c3: { label: "Sunrise", background: "#ffedd5", text: "#431407" },
      c4: { label: "Seafoam", background: "#ccfbf1", text: "#042f2e" },
      c5: { label: "Blossom", background: "#fce7f3", text: "#500724" },
      c6: { label: "Lemon", background: "#fef9c3", text: "#422006" },
    },
    defaultColor: "c1",
  },
  decoration: "balloons",
  entrance: "float",
  opener: "curtain",
});
