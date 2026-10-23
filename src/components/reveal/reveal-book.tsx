"use client";

import { ChevronLeft, ChevronRight, LayoutGrid, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { MessageCard } from "@/components/messages/message-card";
import { Button } from "@/components/ui/button";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { MessageView } from "@/server/services/messages";
import type { TemplateConfig } from "@/templates";
import { boardSurfaceStyle, headingStyle } from "@/templates/styles";
import { BoardIntro } from "./board-intro";
import { DownloadPdfButton } from "./download-pdf-button";
import type { RevealProps } from "./reveal-experience";

type Props = {
  board: RevealProps["board"];
  messages: MessageView[];
  template: TemplateConfig;
  revealSlug: string;
  /** The opener has finished: take focus and listen for arrow keys. */
  active: boolean;
  /** Close the book and show every message at once. */
  onFinish: () => void;
};

type Direction = 1 | -1;

const TURN = {
  duration: 0.8,
  ease: [0.645, 0.045, 0.355, 1],
  // Stacking changes at once; only the turn itself is animated.
  zIndex: { duration: 0 },
} as const;

/**
 * A page turns around its left edge, like a book's. Going forward, the top
 * page swings away and the next one is already waiting underneath; going
 * back, the previous page swings back over the current one.
 */
const PAGE: Variants = {
  enter: (dir: Direction) =>
    dir > 0
      ? { rotateY: 0, scale: 0.96, x: 0, opacity: 1, zIndex: 1 }
      : { rotateY: -100, scale: 1, x: 0, opacity: 1, zIndex: 2 },
  center: {
    rotateY: 0,
    scale: 1,
    x: 0,
    opacity: 1,
    zIndex: 2,
    transition: TURN,
  },
  exit: (dir: Direction) =>
    dir > 0
      ? { rotateY: -100, x: 0, zIndex: 3, transition: TURN }
      : { scale: 0.96, opacity: 0, zIndex: 1, transition: TURN },
};

/** Shadow across a page as it lifts off, or lies under the turning one. */
const SHADE: Variants = {
  enter: { opacity: 0.6 },
  center: { opacity: 0, transition: { duration: 0.8 } },
  exit: { opacity: 0.8, transition: { duration: 0.8 } },
};

/** Cover and end-page content arrives once its page has settled. */
const RISE: Variants = {
  enter: { opacity: 0, y: 14 },
  center: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.35 + i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

/** How far a swipe must travel (px), or how fast (px/s), to turn the page. */
const SWIPE_DISTANCE = 60;
const SWIPE_SPEED = 450;

/**
 * The card read like a book: a cover, one message per page, and an end page
 * leading to the full wall. Turn with the buttons, ←/→ keys, a swipe or the
 * page's corner.
 */
export function RevealBook({
  board,
  messages,
  template,
  revealSlug,
  active,
  onFinish,
}: Props) {
  const total = messages.length + 2;
  const last = total - 1;
  const [[index, dir], setPage] = useState<[number, Direction]>([0, 1]);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const turn = useCallback(
    (delta: Direction) =>
      setPage((prev) => {
        const next = prev[0] + delta;
        return next < 0 || next > last ? prev : [next, delta];
      }),
    [last],
  );

  useEffect(() => {
    if (active) headingRef.current?.focus({ preventScroll: true });
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      // Leave keys alone inside the PDF preview and form fields.
      if ((e.target as Element).closest("[role=dialog], input, textarea"))
        return;
      if (e.key === "ArrowRight" || e.key === "PageDown") turn(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") turn(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, turn]);

  const label =
    index === 0
      ? "Cover"
      : index === last
        ? "The end"
        : `Message ${index} of ${messages.length}`;
  const accent = {
    backgroundColor: template.colors.accent,
    color: template.colors.accentText,
  };

  function renderPage(i: number): ReactNode {
    if (i === 0) {
      return (
        <SurfacePage template={template}>
          <BoardIntro
            board={board}
            messages={messages}
            template={template}
            headingRef={headingRef}
            compact
          >
            <motion.div variants={RISE} custom={1} className="mt-8">
              <Button
                size="lg"
                className="group gap-2 rounded-full px-5 shadow-md"
                style={accent}
                onClick={() => turn(1)}
              >
                Start reading
                <ChevronRight className="transition-transform group-hover:translate-x-1 motion-safe:animate-[ww-nudge_1.6s_ease-in-out_infinite]" />
              </Button>
            </motion.div>
          </BoardIntro>
        </SurfacePage>
      );
    }
    if (i === last) {
      return (
        <SurfacePage template={template}>
          <motion.div
            variants={{
              enter: { scale: 0, rotate: -20 },
              center: {
                scale: 1,
                rotate: 0,
                transition: {
                  delay: 0.45,
                  type: "spring",
                  stiffness: 260,
                  damping: 12,
                },
              },
            }}
            className="text-6xl motion-safe:[&>span]:animate-[ww-beat_1.8s_ease-in-out_2s_infinite]"
            aria-hidden
          >
            <span className="inline-block">💌</span>
          </motion.div>
          <motion.h2
            variants={RISE}
            custom={1}
            className="mt-5 text-3xl leading-tight text-balance sm:text-4xl"
            style={headingStyle(template)}
          >
            That&rsquo;s every message
          </motion.h2>
          <motion.p variants={RISE} custom={2} className="mt-3 opacity-80">
            {pluralize(messages.length, "message")} for {board.recipientName},
            with love.
          </motion.p>
          <motion.div
            variants={RISE}
            custom={3}
            className="mt-8 flex flex-col items-center gap-3"
          >
            <Button
              size="lg"
              className="gap-2 rounded-full px-5 shadow-md"
              style={accent}
              onClick={onFinish}
            >
              <LayoutGrid /> See all messages
            </Button>
            <DownloadPdfButton
              revealSlug={revealSlug}
              className="rounded-full"
            />
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 hover:bg-current/10 hover:text-current"
              onClick={() => setPage([0, -1])}
            >
              <RotateCcw /> Read again
            </Button>
          </motion.div>
        </SurfacePage>
      );
    }
    const message = messages[i - 1];
    return (
      <MessageCard
        message={message}
        template={template}
        eagerImage
        className="absolute inset-0 flex flex-col justify-center-safe overflow-auto overscroll-contain p-7 text-lg sm:p-10 sm:text-xl [&_img]:mx-auto [&_img]:max-h-[38dvh] [&_img]:w-auto"
      />
    );
  }

  return (
    <motion.section
      aria-label={`A card for ${board.recipientName}`}
      className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-4 py-5 sm:py-8"
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.45 } }}
    >
      <div className="flex w-full max-w-lg items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-current/15">
          <motion.div
            className="h-full origin-left rounded-full"
            style={{ backgroundColor: template.colors.accent }}
            initial={false}
            animate={{ scaleX: index / last }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
        {index < last ? (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 hover:bg-current/10 hover:text-current"
            onClick={onFinish}
          >
            <LayoutGrid /> See all
          </Button>
        ) : null}
      </div>

      <div
        className="relative mt-5 h-[min(66dvh,40rem)] w-full max-w-lg sm:mt-7 sm:h-[min(70dvh,42rem)]"
        style={{ perspective: 1800 }}
      >
        {/* The pages still to come, stacked beneath. */}
        {[3, 2, 1].map((depth) =>
          depth <= last - index ? (
            <div
              key={depth}
              aria-hidden
              className="ww-sheet absolute inset-0 transition-transform duration-500"
              style={{
                ...boardSurfaceStyle(template),
                borderRadius: template.cards.radius,
                transform: `translate(${depth * 5}px, ${depth * 4}px)`,
                filter: `brightness(${1 - depth * 0.04})`,
              }}
            />
          ) : null,
        )}

        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={index}
            custom={dir}
            variants={PAGE}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 origin-left cursor-grab active:cursor-grabbing"
            style={{
              borderRadius: template.cards.radius,
              backfaceVisibility: "hidden",
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            dragSnapToOrigin
            onDragEnd={(_, { offset, velocity }) => {
              if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_SPEED)
                turn(1);
              else if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_SPEED)
                turn(-1);
            }}
          >
            {renderPage(index)}
            {/* The book's gutter along the spine. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-10 rounded-[inherit]"
              style={{
                background:
                  "linear-gradient(to right, rgb(0 0 0 / 0.16), rgb(0 0 0 / 0.04) 40%, transparent)",
              }}
            />
            <motion.div
              aria-hidden
              variants={SHADE}
              className="pointer-events-none absolute inset-0 rounded-[inherit]"
              style={{
                background:
                  "linear-gradient(to left, rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.08))",
              }}
            />
            {index < last ? (
              <PageCorner first={index === 0} onClick={() => turn(1)} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Button
          variant="secondary"
          size="icon-lg"
          className="rounded-full shadow-md"
          onClick={() => turn(-1)}
          disabled={index === 0}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <span
          className="min-w-32 text-center text-sm font-medium tabular-nums"
          aria-live="polite"
        >
          {label}
        </span>
        <Button
          variant="secondary"
          size="icon-lg"
          className="rounded-full shadow-md"
          onClick={() => turn(1)}
          disabled={index === last}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
      <p className="mt-3 text-xs opacity-60" aria-hidden>
        <span className="pointer-coarse:hidden">Use ← → to turn the page</span>
        <span className="hidden pointer-coarse:inline">
          Swipe to turn the page
        </span>
      </p>
    </motion.section>
  );
}

/** A page painted in the board's own colours: the cover and the end. */
function SurfacePage({
  template,
  children,
}: {
  template: TemplateConfig;
  children: ReactNode;
}) {
  return (
    <div
      className="ww-sheet absolute inset-0 flex flex-col items-center justify-center-safe overflow-auto overscroll-contain border-l-8 p-8 text-center sm:p-10"
      style={{
        ...boardSurfaceStyle(template),
        borderRadius: template.cards.radius,
        borderLeftColor: template.colors.accent,
      }}
    >
      {children}
    </div>
  );
}

/**
 * A corner lifting off the page, to tap or click to turn it. It flutters on
 * the cover as a hint, and curls further under the pointer.
 */
function PageCorner({
  first,
  onClick,
}: {
  first: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onClick}
      className={cn(
        "absolute right-0 bottom-0 size-12 origin-bottom-right cursor-pointer rounded-br-[inherit] transition-transform duration-300 hover:scale-150 sm:size-14",
        first && "motion-safe:animate-[ww-curl_2.4s_ease-in-out_1.2s_infinite]",
      )}
      style={{
        clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
        background:
          "linear-gradient(135deg, rgb(0 0 0 / 0.18) 0%, rgb(255 255 255 / 0.85) 55%, rgb(0 0 0 / 0.06) 100%)",
        filter: "drop-shadow(-2px -2px 3px rgb(0 0 0 / 0.15))",
      }}
    />
  );
}
