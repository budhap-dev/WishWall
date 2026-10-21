"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { MessageCard } from "@/components/messages/message-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MessageView } from "@/server/services/messages";
import type { TemplateConfig } from "@/templates";

type Props = {
  messages: MessageView[];
  /** Index of the open message, or null when closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
  template: TemplateConfig;
};

/** Enlarged view of one card, with previous/next (buttons and ←/→ keys). */
export function CardLightbox({
  messages,
  index,
  onIndexChange,
  template,
}: Props) {
  const message = index === null ? null : messages[index];
  const go = (delta: number) => {
    if (index === null) return;
    onIndexChange((index + delta + messages.length) % messages.length);
  };

  return (
    <Dialog
      open={message != null}
      onOpenChange={(open) => !open && onIndexChange(null)}
    >
      <DialogContent
        className="max-h-[92dvh] overflow-y-auto border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-xl"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        {message ? (
          <>
            <DialogTitle className="sr-only">
              Message from {message.authorName}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Message {index! + 1} of {messages.length}. Use the left and right
              arrow keys to move between messages.
            </DialogDescription>
            <MessageCard
              message={message}
              template={template}
              className="p-6 text-lg sm:p-8 [&_p]:text-lg"
            />
            {messages.length > 1 ? (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="icon-lg"
                  onClick={() => go(-1)}
                  aria-label="Previous message"
                >
                  <ChevronLeft />
                </Button>
                <span className="rounded-full bg-black/40 px-3 py-1 text-sm text-white tabular-nums">
                  {index! + 1} / {messages.length}
                </span>
                <Button
                  variant="secondary"
                  size="icon-lg"
                  onClick={() => go(1)}
                  aria-label="Next message"
                >
                  <ChevronRight />
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
