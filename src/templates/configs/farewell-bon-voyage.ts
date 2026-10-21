import { defineTemplate } from "../types";

export default defineTemplate({
  id: "farewell-bon-voyage",
  name: "Bon Voyage",
  occasion: "FAREWELL",
  description: "Postcards and paper planes for the next adventure.",
  fonts: { heading: "dmSerif", body: "nunito" },
  colors: {
    background: "#e0f2fe",
    backgroundImage: "radial-gradient(#7dd3fc55 1.5px, transparent 1.5px)",
    backgroundSize: "18px 18px",
    heading: "#0c4a6e",
    text: "#082f49",
    accent: "#0369a1",
    accentText: "#ffffff",
  },
  cards: {
    style: "polaroid",
    radius: 3,
    palette: {
      c1: { label: "Postcard", background: "#ffffff", text: "#082f49" },
      c2: { label: "Sand", background: "#fef3c7", text: "#451a03" },
      c3: { label: "Ocean", background: "#bae6fd", text: "#082f49" },
      c4: { label: "Coral", background: "#fed7aa", text: "#431407" },
      c5: { label: "Palm", background: "#bbf7d0", text: "#052e16" },
      c6: { label: "Sunset", background: "#fecaca", text: "#450a0a" },
    },
    defaultColor: "c1",
  },
  decoration: "planes",
  entrance: "float",
  opener: "envelope",
});
