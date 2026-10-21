import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { MessageView } from "@/server/services/messages";
import type { TemplateConfig } from "@/templates";
import {
  CARD_STYLE_CLASSES,
  cardStyle,
  cardTilt,
  messageTextStyle,
} from "@/templates/styles";
import { RichText } from "./rich-text";
import { StoredImage } from "./stored-image";

type Props = {
  message: Pick<
    MessageView,
    "authorName" | "body" | "image" | "cardColor" | "font" | "textColor"
  >;
  template: TemplateConfig;
  /** Edit/delete controls for the author, rendered in the card's footer. */
  actions?: ReactNode;
  className?: string;
  /** Tilt the card a little, as if placed by hand (stable per seed, e.g. message id). */
  tiltSeed?: string;
  /** Load the image right away rather than when scrolled near (print). */
  eagerImage?: boolean;
};

/** One message, drawn in the board template's card style. */
export function MessageCard({
  message,
  template,
  actions,
  className,
  tiltSeed,
  eagerImage,
}: Props) {
  return (
    <article
      className={cn(
        "overflow-hidden p-4",
        CARD_STYLE_CLASSES[template.cards.style],
        className,
      )}
      style={{
        ...cardStyle(template, message.cardColor),
        // `rotate` (not transform) so it composes with entrance animations.
        rotate: tiltSeed ? `${cardTilt(template, tiltSeed)}deg` : undefined,
      }}
    >
      {message.image ? (
        <StoredImage
          src={message.image.url}
          alt={message.image.alt}
          width={message.image.width}
          height={message.image.height}
          sizes="(min-width: 1280px) 22rem, (min-width: 640px) 45vw, 90vw"
          className="mb-3 h-auto w-full rounded-[inherit]"
          priority={eagerImage}
        />
      ) : null}
      {/* Text sizes are relative (em) so a chosen font's scale and the
          lightbox's larger size both carry through. */}
      <div style={messageTextStyle(template, message)}>
        {message.body ? (
          <RichText
            text={message.body}
            className="text-[0.95em] leading-relaxed break-words"
          />
        ) : null}
        <footer className="mt-3 flex items-end justify-between gap-2">
          <p className="text-[0.875em] font-semibold opacity-85">
            — {message.authorName}
          </p>
          {actions}
        </footer>
      </div>
    </article>
  );
}
