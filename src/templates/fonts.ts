import {
  Amatic_SC,
  Baloo_2,
  Caveat,
  Cormorant_Garamond,
  Dancing_Script,
  DM_Serif_Display,
  Fraunces,
  Lobster,
  Lora,
  Nunito,
  Pacifico,
  Patrick_Hand,
  Playfair_Display,
  Quicksand,
} from "next/font/google";

// Fonts available to templates, self-hosted by next/font. `preload: false`
// because a page only uses one or two; browsers download a font file only
// when text actually uses it.

const amatic = Amatic_SC({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--tpl-amatic",
  preload: false,
});
const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--tpl-baloo",
  preload: false,
});
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--tpl-caveat",
  preload: false,
});
const cormorant = Cormorant_Garamond({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--tpl-cormorant",
  preload: false,
});
const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--tpl-dancing",
  preload: false,
});
const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--tpl-dm-serif",
  preload: false,
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--tpl-fraunces",
  preload: false,
});
const lobster = Lobster({
  weight: "400",
  subsets: ["latin"],
  variable: "--tpl-lobster",
  preload: false,
});
const lora = Lora({
  subsets: ["latin"],
  variable: "--tpl-lora",
  preload: false,
});
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--tpl-nunito",
  preload: false,
});
const pacifico = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--tpl-pacifico",
  preload: false,
});
const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--tpl-patrick-hand",
  preload: false,
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--tpl-playfair",
  preload: false,
});
const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--tpl-quicksand",
  preload: false,
});

const FONTS = {
  amatic,
  baloo,
  caveat,
  cormorant,
  dancing,
  dmSerif,
  fraunces,
  lobster,
  lora,
  nunito,
  pacifico,
  patrickHand,
  playfair,
  quicksand,
} as const;

export type FontKey = keyof typeof FONTS;

export const FONT_KEYS = Object.keys(FONTS) as FontKey[];

/** CSS `font-family` value for a template font (usable directly in `style`). */
export function fontFamily(key: FontKey): string {
  return FONTS[key].style.fontFamily;
}
