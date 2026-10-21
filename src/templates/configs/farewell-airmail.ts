import { defineTemplate } from "../types";

export default defineTemplate({
  id: "farewell-airmail",
  name: "Airmail",
  occasion: "FAREWELL",
  description:
    "Red-and-blue airmail stripes and handwritten notes to send them off.",
  fonts: { heading: "caveat", body: "lora" },
  colors: {
    background: "#fdf6e3",
    // A striped airmail band across the top; the first layer covers the rest.
    backgroundImage:
      "linear-gradient(#0000 0 12px, #fdf6e3 12px), repeating-linear-gradient(135deg, #dc2626 0 16px, #fdf6e3 16px 32px, #1d4ed8 32px 48px, #fdf6e3 48px 64px)",
    backgroundSize: "100% 100%, 100% 100%",
    heading: "#1d4ed8",
    text: "#1c1917",
    accent: "#b91c1c",
    accentText: "#ffffff",
  },
  cards: {
    style: "outline",
    radius: 4,
    palette: {
      c1: { label: "Envelope", background: "#fffdf7", text: "#1c1917" },
      c2: { label: "Air blue", background: "#dbeafe", text: "#172554" },
      c3: { label: "Post red", background: "#fee2e2", text: "#450a0a" },
      c4: { label: "Stamp green", background: "#dcfce7", text: "#052e16" },
      c5: { label: "Parcel", background: "#f5e6c8", text: "#422006" },
      c6: { label: "Ink", background: "#1e3a8a", text: "#f8fafc" },
    },
    defaultColor: "c1",
  },
  decoration: "sparkles",
  entrance: "drop",
  opener: "envelope",
});
