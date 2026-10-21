"use client";

import { motion, type TargetAndTransition } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MessageCard } from "@/components/messages/message-card";
import type { MessageView } from "@/server/services/messages";
import type { Entrance, TemplateConfig } from "@/templates";

const BATCH = 24;

type Variant = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  transition: object;
};

// How cards arrive, per template `entrance`.
const ENTRANCES: Record<Entrance, Variant> = {
  "fade-up": {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  },
  pop: {
    initial: { opacity: 0, scale: 0.55 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 260, damping: 16 },
  },
  drop: {
    initial: { opacity: 0, y: -80, rotate: -8 },
    animate: { opacity: 1, y: 0, rotate: 0 },
    transition: { type: "spring", stiffness: 180, damping: 14 },
  },
  flip: {
    initial: { opacity: 0, rotateY: -90 },
    animate: { opacity: 1, rotateY: 0 },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
  float: {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
  },
};

type Props = {
  messages: MessageView[];
  template: TemplateConfig;
  reducedMotion: boolean;
  /** Render every message at once (printing) instead of in batches. */
  showAll?: boolean;
  onOpenCard: (index: number) => void;
};

/**
 * Masonry grid of cards with staggered entrance animations. Large boards
 * render in batches as the reader scrolls (IntersectionObserver on a sentinel).
 */
export function RevealGrid({
  messages,
  template,
  reducedMotion,
  showAll = false,
  onOpenCard,
}: Props) {
  const [batched, setBatched] = useState(Math.min(BATCH, messages.length));
  const visible = showAll ? messages.length : batched;
  const sentinel = useRef<HTMLDivElement>(null);
  const variant = ENTRANCES[template.entrance];

  useEffect(() => {
    const el = sentinel.current;
    if (!el || visible >= messages.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setBatched((v) => Math.min(v + BATCH, messages.length));
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, messages.length]);

  return (
    <>
      <ul
        className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4"
        style={{ perspective: 1200 }}
      >
        {messages.slice(0, visible).map((message, i) => {
          // Stagger within each batch, capped so long boards don't wait forever.
          const delay = reducedMotion
            ? 0
            : 0.25 + Math.min(i % BATCH, 14) * 0.08;
          return (
            <motion.li
              key={message.id}
              className="ww-print-visible relative mb-5 break-inside-avoid"
              initial={reducedMotion ? false : variant.initial}
              animate={variant.animate}
              transition={{ ...variant.transition, delay }}
              whileHover={reducedMotion ? undefined : { y: -4 }}
            >
              <MessageCard
                message={message}
                template={template}
                tiltSeed={message.id}
              />
              {/* Whole-card click target (a button can't wrap the card's block content). */}
              <button
                type="button"
                onClick={() => onOpenCard(i)}
                className="absolute inset-0 cursor-zoom-in rounded-[inherit] outline-none focus-visible:ring-4 focus-visible:ring-current/50"
                aria-label={`Read ${message.authorName}'s message`}
              />
            </motion.li>
          );
        })}
      </ul>
      {visible < messages.length ? (
        <div
          ref={sentinel}
          className="py-8 text-center text-sm opacity-70 print:hidden"
          aria-live="polite"
        >
          Loading more messages…
        </div>
      ) : null}
    </>
  );
}
