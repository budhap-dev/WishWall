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
  className?: string;
  children?: ReactNode;
};

/** The card's title block: recipient photo, title and who wrote in. */
export function BoardIntro({
  board,
  messages,
  template,
  headingRef,
  className,
  children,
}: Props) {
  return (
    <div className={cn("text-center", className)}>
      {board.recipientPhotoUrl ? (
        <div className="mx-auto mb-6 size-32 overflow-hidden rounded-full border-4 border-white/80 shadow-xl">
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
        className="text-4xl leading-tight text-balance outline-none sm:text-6xl"
        style={headingStyle(template)}
      >
        {board.title}
      </h1>
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
