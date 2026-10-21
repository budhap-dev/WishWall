import { defineTemplate } from "../types";

export default defineTemplate({
  id: "farewell-sunset-road",
  name: "Sunset Road",
  occasion: "FAREWELL",
  description: "Warm sunset gradient with falling autumn leaves.",
  fonts: { heading: "playfair", body: "lora" },
  colors: {
    background: "#fff1e6",
    backgroundImage:
      "linear-gradient(170deg, #ffedd5 0%, #fecdd3 55%, #fbcfe8 100%)",
    heading: "#9a3412",
    text: "#431407",
    accent: "#c2410c",
    accentText: "#ffffff",
  },
  cards: {
    style: "paper",
    radius: 10,
    palette: {
      c1: { label: "Cream", background: "#fffbf5", text: "#431407" },
      c2: { label: "Apricot", background: "#ffedd5", text: "#431407" },
      c3: { label: "Rosewood", background: "#ffe4e6", text: "#4c0519" },
      c4: { label: "Dusk", background: "#ede9fe", text: "#2e1065" },
      c5: { label: "Honey", background: "#fef3c7", text: "#451a03" },
      c6: { label: "Olive", background: "#ecfccb", text: "#1a2e05" },
    },
    defaultColor: "c1",
  },
  decoration: "leaves",
  entrance: "fade-up",
  opener: "curtain",
});
