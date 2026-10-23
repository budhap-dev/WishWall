"use client";

import { BookOpen } from "lucide-react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import type { Occasion } from "@/lib/occasions";
import { seedFromString } from "@/lib/seeded-random";
import type { MessageView } from "@/server/services/messages";
import { resolveTemplate, type TemplateConfig } from "@/templates";
import { boardSurfaceStyle } from "@/templates/styles";
import { BoardIntro } from "./board-intro";
import { CardLightbox } from "./card-lightbox";
import { Decorations, isStaticFriendly } from "./decorations";
import { DownloadPdfButton } from "./download-pdf-button";
import { Opener } from "./openers";
import { RevealBook } from "./reveal-book";
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
/** Reading one message per page, or every message on the wall. */
type View = "book" | "wall";

/**
 * The recipient's experience: an opening animation, then the messages one
 * page at a time like a book, ending on the wall of every card.
 */
export function RevealExperience({
  board,
  messages,
  revealSlug,
}: RevealProps & { revealSlug: string }) {
  const template = resolveTemplate(board.templateId, board.occasion);
  const reducedMotion = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>("closed");
  // With nothing to read yet, there's no book: straight to the (empty) wall.
  const [view, setView] = useState<View>(messages.length > 0 ? "book" : "wall");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [printing, setPrinting] = useState(false);
  const seed = seedFromString(board.id);

  function showWall() {
    window.scrollTo({ top: 0 });
    setView("wall");
  }

  // Browser Print: open the card and render every message before the page is
  // laid out (flushSync, as printing starts right after this event).
  useEffect(() => {
    const beforePrint = () =>
      flushSync(() => {
        setPhase("open");
        setView("wall");
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
            <AnimatePresence mode="wait">
              {view === "book" && !printing ? (
                <RevealBook
                  key="book"
                  board={board}
                  messages={messages}
                  template={template}
                  revealSlug={revealSlug}
                  active={phase === "open"}
                  onFinish={showWall}
                />
              ) : (
                <RevealWall
                  key="wall"
                  board={board}
                  messages={messages}
                  template={template}
                  revealSlug={revealSlug}
                  reducedMotion={reducedMotion}
                  printing={printing}
                  focusTitle={phase === "open"}
                  onOpenCard={setLightbox}
                  onReadAgain={() => setView("book")}
                />
              )}
            </AnimatePresence>
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

type WallProps = {
  board: RevealProps["board"];
  messages: MessageView[];
  template: TemplateConfig;
  revealSlug: string;
  reducedMotion: boolean;
  printing: boolean;
  /** Move focus to the title (once the opener is gone). */
  focusTitle: boolean;
  onOpenCard: (index: number) => void;
  onReadAgain: () => void;
};

/** Every message at once, with the PDF download. */
function RevealWall({
  board,
  messages,
  template,
  revealSlug,
  reducedMotion,
  printing,
  focusTitle,
  onOpenCard,
  onReadAgain,
}: WallProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // For keyboard and screen reader users, arriving here starts at the title.
  useEffect(() => {
    if (focusTitle) headingRef.current?.focus({ preventScroll: true });
  }, [focusTitle]);

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.header
        className="ww-print-visible mx-auto max-w-3xl px-4 pt-14 pb-10 sm:pt-20 print:pt-0"
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <BoardIntro
          board={board}
          messages={messages}
          template={template}
          headingRef={headingRef}
        >
          {messages.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <DownloadPdfButton
                revealSlug={revealSlug}
                variant="default"
                style={{
                  backgroundColor: template.colors.accent,
                  color: template.colors.accentText,
                }}
              />
              <Button
                variant="ghost"
                className="gap-1.5 hover:bg-current/10 hover:text-current print:hidden"
                onClick={onReadAgain}
              >
                <BookOpen /> Read as a book
              </Button>
            </div>
          ) : null}
        </BoardIntro>
      </motion.header>

      <main className="mx-auto max-w-6xl px-4 pb-24 print:pb-4">
        <h2 className="sr-only">Messages</h2>
        {messages.length > 0 ? (
          <RevealGrid
            messages={messages}
            template={template}
            reducedMotion={reducedMotion}
            showAll={printing}
            onOpenCard={onOpenCard}
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
    </motion.div>
  );
}
