import type { Occasion } from "@/generated/prisma/enums";
import anniversaryGoldenHour from "./configs/anniversary-golden-hour";
import anniversaryMoonlitWaltz from "./configs/anniversary-moonlit-waltz";
import anniversaryRoseGarden from "./configs/anniversary-rose-garden";
import birthdayConfettiPop from "./configs/birthday-confetti-pop";
import birthdayMidnightBalloons from "./configs/birthday-midnight-balloons";
import birthdaySprinkleCake from "./configs/birthday-sprinkle-cake";
import congratulationsBlackTie from "./configs/congratulations-black-tie";
import congratulationsChampagne from "./configs/congratulations-champagne";
import congratulationsHooray from "./configs/congratulations-hooray";
import farewellAirmail from "./configs/farewell-airmail";
import farewellBonVoyage from "./configs/farewell-bon-voyage";
import farewellSunsetRoad from "./configs/farewell-sunset-road";
import getWellCozyQuilt from "./configs/get-well-cozy-quilt";
import getWellSunnyDays from "./configs/get-well-sunny-days";
import getWellWildflowers from "./configs/get-well-wildflowers";
import missYouPaperHearts from "./configs/miss-you-paper-hearts";
import missYouRainyDay from "./configs/miss-you-rainy-day";
import missYouStarryNight from "./configs/miss-you-starry-night";
import thankYouBotanical from "./configs/thank-you-botanical";
import thankYouKraftPaper from "./configs/thank-you-kraft-paper";
import thankYouPopArt from "./configs/thank-you-pop-art";
import welcomeAllAboard from "./configs/welcome-all-aboard";
import welcomeFreshStart from "./configs/welcome-fresh-start";
import welcomeOpenDoor from "./configs/welcome-open-door";
import type { TemplateConfig } from "./types";

export * from "./types";

/**
 * All templates. To add one: create a file in ./configs (copy an existing
 * one), then add it here. tests/unit/templates.test.ts fails if a config file
 * isn't registered, an id is duplicated, or a colour pair fails contrast.
 * The first template listed for an occasion is that occasion's default.
 */
export const TEMPLATES: readonly TemplateConfig[] = [
  birthdayConfettiPop,
  birthdayMidnightBalloons,
  birthdaySprinkleCake,
  anniversaryGoldenHour,
  anniversaryRoseGarden,
  anniversaryMoonlitWaltz,
  farewellBonVoyage,
  farewellSunsetRoad,
  farewellAirmail,
  missYouPaperHearts,
  missYouStarryNight,
  missYouRainyDay,
  congratulationsBlackTie,
  congratulationsHooray,
  congratulationsChampagne,
  getWellSunnyDays,
  getWellWildflowers,
  getWellCozyQuilt,
  thankYouBotanical,
  thankYouPopArt,
  thankYouKraftPaper,
  welcomeOpenDoor,
  welcomeFreshStart,
  welcomeAllAboard,
];

const byId = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id: string): TemplateConfig | undefined {
  return byId.get(id);
}

/** Like getTemplate, but falls back to the occasion's default (for boards whose template was removed). */
export function resolveTemplate(
  id: string,
  occasion: Occasion,
): TemplateConfig {
  return byId.get(id) ?? defaultTemplateFor(occasion);
}

export function templatesFor(occasion: Occasion): TemplateConfig[] {
  return TEMPLATES.filter((t) => t.occasion === occasion);
}

export function defaultTemplateFor(occasion: Occasion): TemplateConfig {
  const template = TEMPLATES.find((t) => t.occasion === occasion);
  if (!template) throw new Error(`No template registered for ${occasion}`);
  return template;
}

export function isTemplateForOccasion(id: string, occasion: Occasion): boolean {
  return byId.get(id)?.occasion === occasion;
}
