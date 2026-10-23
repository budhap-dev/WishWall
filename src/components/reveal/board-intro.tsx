import type { ReactNode, Ref } from "react";
import { StoredImage } from "@/components/messages/stored-image";
import { boardSummary } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MessageView } from "@/server/services/messages";
import type { TemplateConfig } from "@/templates";
import { headingStyle } from "@/templates/styles";
import type { RevealProps } from "./reveal-experience";

type Props = {
  board: RevealProps["board"];
  messages: MessageView[];
  template: TemplateConfig;
  headingRef?: Ref<HTMLHeadingElement>;
  /** Smaller type, for the book's cover page. */
  compact?: boolean;
  className?: string;
  children?: ReactNode;
};

/** The card's title block: recipient photo, title, intro and who wrote in. */
export function BoardIntro({
  board,
  messages,
  template,
  headingRef,
  compact = false,
  className,
  children,
}: Props) {
  return (
    <div className={cn("text-center", className)}>
      {board.recipientPhotoUrl ? (
        <div
          className={cn(
            "mx-auto overflow-hidden rounded-full border-4 border-white/80 shadow-xl",
            compact ? "mb-5 size-24 sm:size-28" : "mb-6 size-32",
          )}
        >
          <StoredImage
            src={board.recipientPhotoUrl}
            alt={board.recipientName}
            width={256}
            height={256}
            sizes="128px"
            priority
            className="size-full object-cover"
          />
        </div>
      ) : null}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className={cn(
          "leading-tight text-balance outline-none",
          compact ? "text-4xl sm:text-5xl" : "text-4xl sm:text-6xl",
        )}
        style={headingStyle(template)}
      >
        {board.title}
      </h1>
      {board.intro ? (
        <p
          className={cn(
            "mx-auto max-w-xl whitespace-pre-line",
            compact ? "mt-4 text-base sm:text-lg" : "mt-5 text-lg",
          )}
        >
          {board.intro}
        </p>
      ) : null}
      <p className="mt-4 text-sm opacity-80">
        {boardSummary(
          messages.map((m) => m.authorName),
          board.eventDateLabel,
        )}
      </p>
      {children}
    </div>
  );
}
