import { defineTemplate } from "../types";

export default defineTemplate({
  id: "get-well-cozy-quilt",
  name: "Cozy Quilt",
  occasion: "GET_WELL_SOON",
  description: "A soft gingham quilt and little hearts to tuck them in.",
  fonts: { heading: "patrickHand", body: "nunito" },
  colors: {
    background: "#f0fdfa",
    backgroundImage:
      "linear-gradient(90deg, #99f6e433 50%, transparent 50%), linear-gradient(#99f6e433 50%, transparent 50%)",
    backgroundSize: "36px 36px, 36px 36px",
    heading: "#0f766e",
    text: "#134e4a",
    accent: "#0f766e",
    accentText: "#ffffff",
  },
  cards: {
    style: "sticky",
    radius: 10,
    palette: {
      c1: { label: "Sage", background: "#d1fae5", text: "#022c22" },
      c2: { label: "Blush", background: "#ffe4e6", text: "#4c0519" },
      c3: { label: "Honey", background: "#fef3c7", text: "#451a03" },
      c4: { label: "Lavender", background: "#ede9fe", text: "#2e1065" },
      c5: { label: "Sky", background: "#e0f2fe", text: "#082f49" },
      c6: { label: "Cream", background: "#fffbeb", text: "#1c1917" },
    },
    defaultColor: "c6",
  },
  decoration: "hearts",
  entrance: "pop",
  opener: "gift-box",
});
