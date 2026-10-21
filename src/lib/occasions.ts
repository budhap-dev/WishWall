import { Occasion } from "@/generated/prisma/enums";

export { Occasion };

export type OccasionInfo = {
  label: string;
  emoji: string;
  /** Short line shown in the wizard. */
  blurb: string;
  /** Suggested board title; `{name}` is replaced with the recipient's name. */
  titleSuggestion: string;
};

export const OCCASIONS: Record<Occasion, OccasionInfo> = {
  BIRTHDAY: {
    label: "Birthday",
    emoji: "🎂",
    blurb: "Another trip around the sun",
    titleSuggestion: "Happy Birthday, {name}!",
  },
  ANNIVERSARY: {
    label: "Anniversary",
    emoji: "💍",
    blurb: "Celebrate the years together",
    titleSuggestion: "Happy Anniversary, {name}!",
  },
  FAREWELL: {
    label: "Farewell",
    emoji: "👋",
    blurb: "Send them off in style",
    titleSuggestion: "We'll miss you, {name}!",
  },
  MISS_YOU: {
    label: "Miss You",
    emoji: "💌",
    blurb: "Close the distance",
    titleSuggestion: "Missing you, {name}",
  },
  CONGRATULATIONS: {
    label: "Congratulations",
    emoji: "🎉",
    blurb: "Cheer a big win",
    titleSuggestion: "Congratulations, {name}!",
  },
  GET_WELL_SOON: {
    label: "Get Well Soon",
    emoji: "🌻",
    blurb: "Warm wishes for a quick recovery",
    titleSuggestion: "Get well soon, {name}",
  },
  THANK_YOU: {
    label: "Thank You",
    emoji: "🙏",
    blurb: "Show some gratitude",
    titleSuggestion: "Thank you, {name}!",
  },
  WELCOME: {
    label: "Welcome",
    emoji: "🏡",
    blurb: "Greet someone new",
    titleSuggestion: "Welcome aboard, {name}!",
  },
};

export const OCCASION_LIST = Object.values(Occasion);

export function suggestTitle(occasion: Occasion, recipientName: string) {
  return OCCASIONS[occasion].titleSuggestion.replace(
    "{name}",
    recipientName.trim() || "friend",
  );
}
