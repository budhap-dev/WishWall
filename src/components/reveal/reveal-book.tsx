"use client";

import { ChevronLeft, ChevronRight, LayoutGrid, RotateCcw } from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
  type Variants,
} from "motion/react";
import {
  type CSSProperties,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { MessageCard } from "@/components/messages/message-card";
import { StoredImage } from "@/components/messages/stored-image";
import { Button } from "@/components/ui/button";
import { contrastRatio, luminance } from "@/lib/color";
import { pluralize } from "@/lib/format";
import { OCCASIONS } from "@/lib/occasions";
import { cn } from "@/lib/utils";
import type { MessageView } from "@/server/services/messages";
import type { TemplateConfig } from "@/templates";
import { boardSurfaceStyle, cardStyle, headingStyle } from "@/templates/styles";
import { DownloadPdfButton } from "./download-pdf-button";
import { PageDecor } from "./page-decor";
import type { RevealProps } from "./reveal-experience";

type Props = {
  board: RevealProps["board"];
  messages: MessageView[];
  template: TemplateConfig;
  revealSlug: string;
  /** The opener has finished: take focus and listen for arrow keys. */
  active: boolean;
  /** They've read to the end before, so may skip straight to the wall. */
  readBefore: boolean;
  /** Close the book and show every message at once. */
  onFinish: () => void;
};

type Direction = 1 | -1;

const TURN = {
  duration: 1,
  ease: [0.45, 0.05, 0.3, 1],
  // Stacking changes at once; only the turn itself is animated.
  zIndex: { duration: 0 },
} as const;

/**
 * A page turns over the spine (its left edge) like a book's, showing its
 * back as it lands on the left. Going forward, the next page is already
 * waiting underneath; going back, the previous page turns back over the
 * current one. (No opacity here: it would flatten the page's two faces.)
 */
const PAGE: Variants = {
  enter: (dir: Direction) =>
    dir > 0
      ? { rotateY: 0, scale: 0.96, zIndex: 1 }
      : { rotateY: -180, scale: 1, zIndex: 2 },
  center: { rotateY: 0, scale: 1, zIndex: 2, transition: TURN },
  exit: (dir: Direction) =>
    dir > 0
      ? { rotateY: -180, zIndex: 3, transition: TURN }
      : { rotateY: 0, scale: 0.96, zIndex: 1, transition: TURN },
};

/** The page's back fades away once it has landed on the left. */
const BACK: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { delay: 0.8, duration: 0.25 } },
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

/** The card while still in its envelope: small, low and a little askew. */
const OUT = { opacity: 0, y: 140, scale: 0.45, rotate: -6 };

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
  readBefore,
  onFinish,
}: Props) {
  const total = messages.length + 2;
  const last = total - 1;
  // The page open, which way it turned, and the furthest page reached.
  const [[index, dir, furthest], setPage] = useState<
    [number, Direction, number]
  >([0, 1, readBefore ? last : 0]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Every message gets read before the wall is offered.
  const readAll = furthest === last;

  const turn = useCallback(
    (delta: Direction) =>
      setPage((prev) => {
        const next = prev[0] + delta;
        return next < 0 || next > last
          ? prev
          : [next, delta, Math.max(prev[2], next)];
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

  function paperColor(i: number): string {
    if (i === 0 || i === last) return brightScheme(template).colors[0];
    return String(
      cardStyle(template, messages[i - 1].cardColor).backgroundColor,
    );
  }

  function renderPage(i: number): ReactNode {
    if (i === 0) {
      return (
        <CoverPage
          board={board}
          messages={messages}
          template={template}
          headingRef={headingRef}
          active={active}
          onStart={() => turn(1)}
        />
      );
    }
    if (i === last) {
      return (
        <BrightPage template={template} occasion={board.occasion} play>
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
            style={{
              ...headingStyle(template),
              color: brightScheme(template).heading,
            }}
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
              onClick={() => setPage([0, -1, last])}
            >
              <RotateCcw /> Read again
            </Button>
          </motion.div>
        </BrightPage>
      );
    }
    const message = messages[i - 1];
    return (
      <>
        <MessageCard
          message={message}
          template={template}
          eagerImage
          className="absolute inset-0 flex flex-col justify-center-safe overflow-auto overscroll-contain px-9 py-12 text-lg sm:px-12 sm:text-xl [&_img]:mx-auto [&_img]:max-h-[38dvh] [&_img]:w-auto"
        />
        <PageDecor
          template={template}
          occasion={board.occasion}
          seed={message.id}
          color={String(cardStyle(template, message.cardColor).color)}
          pageNumber={i}
        />
      </>
    );
  }

  return (
    <motion.section
      aria-label={`A card for ${board.recipientName}`}
      className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-4 py-5 sm:py-8"
      // The card comes out of the envelope (or box, or curtain) and grows to
      // full size once the opener is done.
      initial={OUT}
      animate={active ? { opacity: 1, y: 0, scale: 1, rotate: 0 } : OUT}
      transition={{ type: "spring", stiffness: 70, damping: 14 }}
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
        {readAll && index < last ? (
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

        {/* The next page, waiting underneath to be uncovered as this one
            is slid over. */}
        {index < last ? (
          // Settled ("center") at once, decorations and all.
          <motion.div
            key={index + 1}
            aria-hidden
            inert
            initial={false}
            animate="center"
            className="absolute inset-0 scale-[0.96]"
            style={{ borderRadius: template.cards.radius }}
          >
            {renderPage(index + 1)}
          </motion.div>
        ) : null}

        <AnimatePresence initial={false} custom={dir}>
          <Sheet
            key={index}
            dir={dir}
            radius={template.cards.radius}
            backColor={paperColor(index)}
            canForward={index < last}
            canBack={index > 0}
            onTurn={turn}
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
              <PageCorner
                side="right"
                hint={index === 0}
                onClick={() => turn(1)}
              />
            ) : null}
            {index > 0 ? (
              <PageCorner side="left" onClick={() => turn(-1)} />
            ) : null}
          </Sheet>
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

/**
 * The top page. Sliding it left lifts it off the spine under the finger (or
 * mouse) and lets go into a full turn, or springs back if it didn't go far;
 * sliding right leans it back toward the previous page. Everything on the
 * page only scrolls vertically to touch (`touch-action: pan-y`): a long
 * message scrolls inside the page, and without it a phone would claim a
 * sideways swipe on the text for scrolling too.
 */
function Sheet({
  dir,
  radius,
  backColor,
  canForward,
  canBack,
  onTurn,
  children,
}: {
  dir: Direction;
  radius: TemplateConfig["cards"]["radius"];
  /** The paper's colour, for the back of the page. */
  backColor: string;
  canForward: boolean;
  canBack: boolean;
  onTurn: (delta: Direction) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Shared with the turn animation, so a released slide carries on from
  // wherever the page was let go.
  const rotateY = useMotionValue(0);
  // Paper bends as it turns: the free edge lags, most of all mid-turn.
  const skewY = useTransform(rotateY, [0, -90, -180], [0, -4, 0]);
  // Light falls off the front as it lifts, and onto the back as it lands.
  const frontShade = useTransform(rotateY, [0, -90], [0, 0.55]);
  const backShade = useTransform(rotateY, [-90, -180], [0.55, 0.08]);

  return (
    <motion.div
      ref={ref}
      custom={dir}
      variants={PAGE}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 origin-left cursor-grab touch-pan-y select-none active:cursor-grabbing [&_*]:touch-pan-y"
      style={{
        rotateY,
        skewY,
        borderRadius: radius,
        transformStyle: "preserve-3d",
      }}
      onPan={(_, { offset }) => {
        const width = ref.current?.offsetWidth || 400;
        // The page follows the finger over the spine, all the way across.
        if (offset.x < 0 && canForward)
          rotateY.set(Math.max(-175, (offset.x / width) * 180));
        else if (offset.x > 0 && canBack)
          rotateY.set(Math.min(12, (offset.x / width) * 30));
      }}
      onPanEnd={(_, { offset, velocity }) => {
        if (
          canForward &&
          (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_SPEED)
        )
          onTurn(1);
        else if (
          canBack &&
          (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_SPEED)
        )
          onTurn(-1);
        else
          animate(rotateY, 0, { type: "spring", stiffness: 300, damping: 26 });
      }}
    >
      <div
        className="absolute inset-0 rounded-[inherit]"
        style={{ backfaceVisibility: "hidden" }}
      >
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            opacity: frontShade,
            background:
              "linear-gradient(to left, rgb(0 0 0 / 0.5), rgb(0 0 0 / 0.1) 60%, transparent)",
          }}
        />
      </div>
      {/* The back of the page: plain paper, seen once it's past the spine. */}
      <motion.div
        aria-hidden
        variants={BACK}
        className="ww-sheet ww-paper absolute inset-0 rounded-[inherit]"
        style={{
          backgroundColor: backColor,
          transform: "rotateY(180deg)",
          backfaceVisibility: "hidden",
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-[inherit]"
          style={{
            opacity: backShade,
            background:
              "linear-gradient(to left, rgb(0 0 0 / 0.45), transparent 70%)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

type Bright = {
  /** Light colours from the card palette, for the page's moving gradient. */
  colors: string[];
  text: string;
  /** The template's accent or heading colour if it reads on them, else `text`. */
  heading: string;
};

/** A bright, readable colour scheme drawn from the template's card palette. */
function brightScheme(t: TemplateConfig): Bright {
  const palette = Object.values(t.cards.palette);
  const light = palette.filter((c) => luminance(c.background) > 0.55);
  const picks = (light.length > 0 ? light : palette).slice(0, 3);
  const readsOnAll = (color: string) =>
    picks.every((c) => contrastRatio(color, c.background) >= 3);
  const heading =
    [t.colors.accent, t.colors.heading].find(readsOnAll) ?? picks[0].text;
  return {
    colors: picks.map((c) => c.background),
    text: picks[0].text,
    heading,
  };
}

/** Bunting flags and floating ornaments, placed around the page's edges. */
const FLAGS = 9;
const ORNAMENTS: { x: number; y: number; size: number }[] = [
  { x: 7, y: 22, size: 1.6 },
  { x: 91, y: 20, size: 1.1 },
  { x: 9, y: 37, size: 0.9 },
  { x: 92, y: 38, size: 1.5 },
  { x: 5, y: 54, size: 1.2 },
  { x: 94, y: 56, size: 0.9 },
  { x: 13, y: 70, size: 1.4 },
  { x: 87, y: 72, size: 1.2 },
  { x: 8, y: 88, size: 1 },
  { x: 26, y: 93, size: 1.3 },
  { x: 74, y: 92, size: 1 },
  { x: 92, y: 88, size: 1.6 },
];
const SYMBOLS = ["✦", "♥", "★", "✿"];

/**
 * A festive page: a slowly shifting gradient in the card colours, a framed
 * border, swaying bunting and ornaments that pop in and bob. Used for the
 * cover and the end page.
 */
function BrightPage({
  template,
  occasion,
  play,
  children,
}: {
  template: TemplateConfig;
  occasion: RevealProps["board"]["occasion"];
  /** Show the decorations (they pop in as they mount). */
  play: boolean;
  children: ReactNode;
}) {
  const scheme = brightScheme(template);
  const [a, b = a, c = b] = scheme.colors;
  const accent = template.colors.accent;
  const flagColors = [
    accent,
    `color-mix(in oklab, ${accent}, white 45%)`,
    scheme.heading,
  ];
  const emoji = OCCASIONS[occasion].emoji;

  return (
    <div
      className="ww-sheet ww-sheen absolute inset-0 overflow-hidden"
      style={{
        borderRadius: template.cards.radius,
        color: scheme.text,
        backgroundColor: a,
        backgroundImage: `radial-gradient(90% 60% at 50% 0%, rgb(255 255 255 / 0.7), transparent 70%), linear-gradient(125deg, ${a}, ${b}, ${c}, ${a})`,
        backgroundSize: "100% 100%, 300% 300%",
        fontFamily: boardSurfaceStyle(template).fontFamily,
      }}
    >
      {/* A greeting card's frame. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-[calc(var(--r)-6px)] border-2 sm:inset-4"
        style={
          {
            "--r": template.cards.radius,
            borderColor: `color-mix(in oklab, ${accent} 45%, transparent)`,
          } as CSSProperties
        }
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[18px] rounded-[calc(var(--r)-10px)] border sm:inset-[22px]"
        style={
          {
            "--r": template.cards.radius,
            borderColor: `color-mix(in oklab, ${accent} 25%, transparent)`,
          } as CSSProperties
        }
      />

      {play ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* Bunting strung across the top. */}
          <svg
            className="absolute inset-x-0 top-0 h-14 w-full"
            viewBox="0 0 100 20"
            preserveAspectRatio="none"
          >
            <path
              d="M0 2 Q50 16 100 2"
              fill="none"
              stroke={scheme.text}
              strokeOpacity="0.35"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {Array.from({ length: FLAGS }, (_, i) => {
            const t = (i + 0.5) / FLAGS;
            // On the string's curve: a quadratic from (0,2) via (50,16) to (100,2).
            const y = (1 - t) ** 2 * 2 + 2 * (1 - t) * t * 16 + t ** 2 * 2;
            return (
              <span
                key={i}
                className="ww-ornament ww-flag absolute -ml-2 h-6 w-4 sm:-ml-2.5 sm:h-7 sm:w-5"
                style={
                  {
                    left: `${t * 100}%`,
                    top: `calc(${(y / 20) * 3.5}rem - 2px)`,
                    backgroundColor: flagColors[i % flagColors.length],
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    "--d": `${700 + i * 60}ms`,
                    "--dur": `${2.6 + (i % 3) * 0.5}s`,
                  } as CSSProperties
                }
              />
            );
          })}
          {ORNAMENTS.map((o, i) => (
            <span
              key={i}
              className="ww-ornament ww-bob absolute -ml-2 leading-none"
              style={
                {
                  left: `${o.x}%`,
                  top: `${o.y}%`,
                  fontSize: `${o.size}rem`,
                  color: i % 2 ? accent : scheme.heading,
                  "--d": `${900 + i * 70}ms`,
                  "--dur": `${3 + (i % 4) * 0.7}s`,
                } as CSSProperties
              }
            >
              {i % 3 === 0 ? emoji : SYMBOLS[i % SYMBOLS.length]}
            </span>
          ))}
        </div>
      ) : null}

      <div className="absolute inset-0 flex flex-col items-center justify-center-safe overflow-auto overscroll-contain px-8 pt-16 pb-10 text-center sm:px-12">
        {children}
      </div>
    </div>
  );
}

const COVER: Variants = {
  hide: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.45 } },
};
const POP: Variants = {
  hide: { opacity: 0, scale: 0.4 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 240, damping: 14 },
  },
};
const UP: Variants = {
  hide: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

/** The cover: who it's for, a line about who wrote, and "Start reading". */
function CoverPage({
  board,
  messages,
  template,
  headingRef,
  active,
  onStart,
}: {
  board: RevealProps["board"];
  messages: MessageView[];
  template: TemplateConfig;
  headingRef: Ref<HTMLHeadingElement>;
  active: boolean;
  onStart: () => void;
}) {
  const scheme = brightScheme(template);
  const accent = template.colors.accent;

  return (
    <BrightPage template={template} occasion={board.occasion} play={active}>
      <motion.div
        variants={COVER}
        initial="hide"
        animate={active ? "show" : "hide"}
        className="flex flex-col items-center"
      >
        <motion.div variants={POP} className="relative mb-6">
          <span
            aria-hidden
            className="absolute -inset-2.5 rounded-full border-2 border-dashed motion-safe:animate-[spin_16s_linear_infinite]"
            style={{ borderColor: accent }}
          />
          {board.recipientPhotoUrl ? (
            <div className="size-24 overflow-hidden rounded-full border-4 border-white shadow-xl sm:size-28">
              <StoredImage
                src={board.recipientPhotoUrl}
                alt={board.recipientName}
                width={256}
                height={256}
                sizes="112px"
                priority
                className="size-full object-cover"
              />
            </div>
          ) : (
            <div
              aria-hidden
              className="ww-bob flex size-24 items-center justify-center rounded-full border-4 border-white bg-white/70 text-5xl shadow-xl sm:size-28 sm:text-6xl"
            >
              {OCCASIONS[board.occasion].emoji}
            </div>
          )}
        </motion.div>
        <motion.h1
          ref={headingRef}
          tabIndex={-1}
          variants={UP}
          className="text-4xl leading-tight text-balance outline-none sm:text-5xl"
          style={{ ...headingStyle(template), color: scheme.heading }}
        >
          {board.title}
        </motion.h1>
        <motion.p
          variants={UP}
          className="mt-4 max-w-xs text-lg text-balance sm:text-xl"
        >
          Your friends and well-wishers have written you something special 💛
        </motion.p>
        <motion.p
          variants={UP}
          className="mt-3 rounded-full bg-white/60 px-3 py-1 text-sm font-medium shadow-sm"
        >
          {pluralize(messages.length, "message")} inside
        </motion.p>
        <motion.div variants={POP} className="mt-8">
          <Button
            size="lg"
            className="group relative gap-2 overflow-hidden rounded-full px-6 text-base shadow-lg hover:opacity-90 pointer-coarse:h-12"
            style={{
              backgroundColor: accent,
              color: template.colors.accentText,
            }}
            onClick={onStart}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/35 motion-safe:animate-[ww-shine_3s_ease-in-out_1.5s_infinite]"
              style={{ translate: "-120% 0" }}
            />
            Start reading
            <ChevronRight className="transition-transform group-hover:translate-x-1 motion-safe:animate-[ww-nudge_1.6s_ease-in-out_infinite]" />
          </Button>
        </motion.div>
      </motion.div>
    </BrightPage>
  );
}

/**
 * A corner lifting off the page, to tap or click to turn it: the right one
 * forward, the left one back. The cover's flutters as a hint, and either
 * curls further under the pointer.
 */
function PageCorner({
  side,
  hint = false,
  onClick,
}: {
  side: "left" | "right";
  hint?: boolean;
  onClick: () => void;
}) {
  const right = side === "right";
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onClick}
      className={cn(
        "absolute bottom-0 size-12 cursor-pointer transition-transform duration-300 hover:scale-150 sm:size-14",
        right
          ? "right-0 origin-bottom-right rounded-br-[inherit]"
          : "left-0 origin-bottom-left rounded-bl-[inherit]",
        hint && "motion-safe:animate-[ww-curl_2.4s_ease-in-out_1.2s_infinite]",
      )}
      style={{
        clipPath: right
          ? "polygon(100% 0, 100% 100%, 0 100%)"
          : "polygon(0 0, 100% 100%, 0 100%)",
        background: `linear-gradient(${right ? 135 : 225}deg, rgb(0 0 0 / 0.18) 0%, rgb(255 255 255 / 0.85) 55%, rgb(0 0 0 / 0.06) 100%)`,
      }}
    />
  );
}
