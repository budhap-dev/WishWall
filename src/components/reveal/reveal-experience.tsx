"use client";

import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { StoredImage } from "@/components/messages/stored-image";
import { boardSummary } from "@/lib/format";
import type { Occasion } from "@/lib/occasions";
import { seedFromString } from "@/lib/seeded-random";
import type { MessageView } from "@/server/services/messages";
import { resolveTemplate } from "@/templates";
import { boardSurfaceStyle, headingStyle } from "@/templates/styles";
import { CardLightbox } from "./card-lightbox";
import { Decorations, isStaticFriendly } from "./decorations";
import { DownloadPdfButton } from "./download-pdf-button";
import { Opener } from "./openers";
import { RevealGrid } from "./reveal-grid";

export type RevealProps = {
  board: {
    id: string;
    title: string;
    intro: string | null;
    recipientName: string;
    recipientPhotoUrl: string | null;
    eventDateLabel: string | null;
    occasion: Occasion;
    templateId: string;
  };
  messages: MessageView[];
};

type Phase = "closed" | "opening" | "open";

/** The recipient's experience: opening animation, then the card wall. */
export function RevealExperience({
  board,
  messages,
  revealSlug,
}: RevealProps & { revealSlug: string }) {
  const template = resolveTemplate(board.templateId, board.occasion);
  const reducedMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>("closed");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [printing, setPrinting] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const seed = seedFromString(board.id);

  // Once the opener is gone, move focus to the title for keyboard/screen reader users.
  useEffect(() => {
    if (phase === "open") headingRef.current?.focus({ preventScroll: true });
  }, [phase]);

  // Browser Print: open the card and render every message before the page is
  // laid out (flushSync, as printing starts right after this event).
  useEffect(() => {
    const beforePrint = () =>
      flushSync(() => {
        setPhase("open");
        setPrinting(true);
      });
    window.addEventListener("beforeprint", beforePrint);
    return () => window.removeEventListener("beforeprint", beforePrint);
  }, []);

  const showDecorations =
    !reducedMotion || isStaticFriendly(template.decoration);

  return (
    // "user" makes every motion component honour prefers-reduced-motion.
    <MotionConfig reducedMotion="user">
      <div
        className="relative min-h-dvh overflow-x-clip"
        style={boardSurfaceStyle(template)}
      >
        {showDecorations ? (
          <Decorations
            template={template}
            seed={seed}
            density={phase === "closed" ? 0.5 : 1}
          />
        ) : null}

        {phase !== "closed" ? (
          <div className="relative z-10" inert={phase === "opening"}>
            <motion.header
              className="ww-print-visible mx-auto max-w-3xl px-4 pt-14 pb-10 text-center sm:pt-20 print:pt-0"
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
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
              {board.intro ? (
                <p className="mx-auto mt-5 max-w-xl text-lg whitespace-pre-line">
                  {board.intro}
                </p>
              ) : null}
              <p className="mt-4 text-sm opacity-80">
                {boardSummary(
                  messages.map((m) => m.authorName),
                  board.eventDateLabel,
                )}
              </p>
              {messages.length > 0 ? (
                <DownloadPdfButton
                  revealSlug={revealSlug}
                  variant="default"
                  className="mt-6"
                  style={{
                    backgroundColor: template.colors.accent,
                    color: template.colors.accentText,
                  }}
                />
              ) : null}
            </motion.header>

            <main className="mx-auto max-w-6xl px-4 pb-24 print:pb-4">
              <h2 className="sr-only">Messages</h2>
              {messages.length > 0 ? (
                <RevealGrid
                  messages={messages}
                  template={template}
                  reducedMotion={reducedMotion}
                  showAll={printing}
                  onOpenCard={setLightbox}
                />
              ) : (
                <p className="py-16 text-center text-lg opacity-80">
                  Messages will appear here as friends add them. ✨
                </p>
              )}
            </main>

            <footer className="pb-10 text-center text-xs opacity-60 print:pb-0">
              Made with WishWall
            </footer>
          </div>
        ) : null}

        {phase !== "open" ? (
          <Opener
            template={template}
            recipientName={board.recipientName}
            reducedMotion={reducedMotion}
            onOpening={() => setPhase("opening")}
            onOpened={() => setPhase("open")}
          />
        ) : null}

        <CardLightbox
          messages={messages}
          index={lightbox}
          onIndexChange={setLightbox}
          template={template}
        />
      </div>
    </MotionConfig>
  );
}
