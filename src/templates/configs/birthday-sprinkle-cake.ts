import { defineTemplate } from "../types";

export default defineTemplate({
  id: "birthday-sprinkle-cake",
  name: "Sprinkle Cake",
  occasion: "BIRTHDAY",
  description: "Frosting pastels and rainbow sprinkles, with streamers on top.",
  fonts: { heading: "lobster", body: "quicksand" },
  colors: {
    background: "#fdf2f8",
    backgroundImage:
      "linear-gradient(35deg, transparent 46%, #f472b640 46% 54%, transparent 54%), linear-gradient(-50deg, transparent 46%, #38bdf840 46% 54%, transparent 54%), linear-gradient(80deg, transparent 46%, #facc1540 46% 54%, transparent 54%)",
    backgroundSize: "58px 58px, 74px 74px, 92px 92px",
    heading: "#be185d",
    text: "#500724",
    accent: "#be185d",
    accentText: "#ffffff",
  },
  cards: {
    style: "paper",
    radius: 20,
    palette: {
      c1: { label: "Strawberry", background: "#fbcfe8", text: "#500724" },
      c2: { label: "Mint", background: "#bbf7d0", text: "#052e16" },
      c3: { label: "Vanilla", background: "#fef9c3", text: "#422006" },
      c4: { label: "Blueberry", background: "#c7d2fe", text: "#1e1b4b" },
      c5: { label: "Peach", background: "#fed7aa", text: "#431407" },
      c6: { label: "Frosting", background: "#ffffff", text: "#500724" },
    },
    defaultColor: "c6",
  },
  decoration: "streamers",
  entrance: "flip",
  opener: "curtain",
});
