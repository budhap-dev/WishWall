import { cn } from "@/lib/utils";
import type { CardColorKey, TemplateConfig } from "@/templates";
import {
  boardSurfaceStyle,
  CARD_STYLE_CLASSES,
  cardStyle,
  headingStyle,
} from "@/templates/styles";

const SAMPLE_CARDS: { color: CardColorKey; author: string; text: string }[] = [
  {
    color: "c1",
    author: "Priya",
    text: "Wishing you the very best today and always!",
  },
  {
    color: "c2",
    author: "Sam",
    text: "So lucky to know you. Let's celebrate soon 🎉",
  },
  { color: "c3", author: "Alex", text: "You make every day brighter." },
  { color: "c4", author: "Jo", text: "Big hugs from all of us!" },
];

type Props = {
  template: TemplateConfig;
  title: string;
  intro?: string;
  /** "compact" for picker thumbnails; "full" for the large live preview. */
  size?: "compact" | "full";
  className?: string;
};

/** A miniature board rendered with a template, using sample messages. */
export function TemplatePreview({
  template,
  title,
  intro,
  size = "full",
  className,
}: Props) {
  const compact = size === "compact";
  const cards = compact ? SAMPLE_CARDS.slice(0, 3) : SAMPLE_CARDS;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl",
        compact ? "p-3" : "p-5 sm:p-6",
        className,
      )}
      style={boardSurfaceStyle(template)}
      aria-hidden={compact || undefined}
    >
      <p
        className={cn(
          "text-center leading-tight",
          compact ? "text-lg" : "text-2xl sm:text-3xl",
        )}
        style={headingStyle(template)}
      >
        {title || "Your board title"}
      </p>
      {!compact && intro ? (
        <p className="mx-auto mt-2 line-clamp-2 max-w-md text-center text-sm opacity-90">
          {intro}
        </p>
      ) : null}
      <div
        className={cn(
          "mt-4 grid gap-3",
          compact ? "grid-cols-3 gap-2" : "grid-cols-2",
        )}
      >
        {cards.map((card) => (
          <div
            key={card.color}
            className={cn(
              CARD_STYLE_CLASSES[template.cards.style],
              compact ? "p-2 text-[10px] leading-snug" : "p-3 text-sm",
            )}
            style={cardStyle(template, card.color)}
          >
            <p className={compact ? "line-clamp-3" : undefined}>{card.text}</p>
            <p
              className={cn(
                "mt-1 font-semibold opacity-80",
                compact && "text-[9px]",
              )}
            >
              — {card.author}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
