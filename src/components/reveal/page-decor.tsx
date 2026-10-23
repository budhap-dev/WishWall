"use client";

import {
  Award,
  Balloon,
  Cake,
  Compass,
  Crown,
  DoorOpen,
  Feather,
  Flower,
  Flower2,
  Gem,
  Gift,
  Hand,
  Heart,
  HeartHandshake,
  House,
  Leaf,
  Luggage,
  type LucideIcon,
  Mail,
  MapPin,
  Medal,
  Moon,
  PartyPopper,
  Plane,
  Rainbow,
  Send,
  Sparkles,
  Star,
  Sun,
  Trophy,
} from "lucide-react";
import { motion, type Variants } from "motion/react";
import type { CSSProperties } from "react";
import type { Occasion } from "@/lib/occasions";
import { seededRandom, seedFromString } from "@/lib/seeded-random";
import type { TemplateConfig } from "@/templates";
import { fontFamily } from "@/templates/fonts";

const ICONS: Record<Occasion, LucideIcon[]> = {
  BIRTHDAY: [Cake, Gift, PartyPopper, Balloon, Star],
  ANNIVERSARY: [Heart, Gem, Sparkles, Flower, Crown],
  FAREWELL: [Plane, Luggage, Compass, MapPin, Send],
  MISS_YOU: [Heart, Mail, Moon, Feather, Star],
  CONGRATULATIONS: [Trophy, Award, PartyPopper, Medal, Sparkles],
  GET_WELL_SOON: [Flower2, Sun, Heart, Leaf, Rainbow],
  THANK_YOU: [HeartHandshake, Heart, Gift, Flower, Sparkles],
  WELCOME: [House, DoorOpen, Sparkles, Hand, Star],
};

/**
 * Where icons sit: in the page's padding, clear of the text and of the
 * turning corners at the bottom.
 */
const SLOTS: { style: CSSProperties; size: number }[] = [
  { style: { top: 14, right: 18 }, size: 24 },
  { style: { top: "44%", right: 8 }, size: 16 },
  { style: { top: "28%", left: 12 }, size: 15 },
  { style: { bottom: 12, left: "26%" }, size: 17 },
  { style: { bottom: 12, right: "26%" }, size: 19 },
  { style: { top: "70%", left: 10 }, size: 14 },
];

const POP: Variants = {
  enter: { opacity: 0, scale: 0 },
  center: (i: number) => ({
    opacity: 0.55,
    scale: 1,
    transition: {
      delay: 0.45 + i * 0.07,
      type: "spring",
      stiffness: 260,
      damping: 13,
    },
  }),
};

type Props = {
  template: TemplateConfig;
  occasion: Occasion;
  /** Seeds the layout, so each page differs but never changes. */
  seed: string;
  /** The card's text colour, which the decorations are drawn in. */
  color: string;
  pageNumber: number;
};

/**
 * Trimmings for a message page: a strip of washi tape, a large opening quote
 * mark, a few of the occasion's icons that pop in and bob, and the page
 * number. They animate in as the page settles (the page's enter/center
 * variants).
 */
export function PageDecor({
  template,
  occasion,
  seed,
  color,
  pageNumber,
}: Props) {
  const random = seededRandom(seedFromString(seed));
  const icons = ICONS[occasion];
  const offset = Math.floor(random() * icons.length);
  const tapeTilt = (random() * 2 - 1) * 5;
  const accent = template.colors.accent;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      style={{ color }}
    >
      {/* Washi tape holding the page in. */}
      <motion.span
        className="absolute top-0 left-1/2 h-6 w-24 origin-center shadow-sm sm:w-28"
        variants={{
          enter: { opacity: 0, scaleX: 0.2 },
          center: {
            opacity: 0.85,
            scaleX: 1,
            transition: { delay: 0.35, duration: 0.4, ease: "easeOut" },
          },
        }}
        style={{
          x: "-50%",
          y: "-30%",
          rotate: tapeTilt,
          backgroundColor: `color-mix(in oklab, ${accent} 35%, white)`,
          backgroundImage:
            "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.35) 0 6px, transparent 6px 12px)",
          clipPath:
            "polygon(0 0, 100% 0, 97% 25%, 100% 50%, 97% 75%, 100% 100%, 0 100%, 3% 75%, 0 50%, 3% 25%)",
        }}
      />
      <motion.span
        className="absolute top-1 left-4 text-7xl leading-none sm:left-6 sm:text-8xl"
        variants={{
          enter: { opacity: 0, y: -10 },
          center: {
            opacity: 0.14,
            y: 0,
            transition: { delay: 0.3, duration: 0.5 },
          },
        }}
        style={{ fontFamily: fontFamily(template.fonts.heading) }}
      >
        &ldquo;
      </motion.span>

      {SLOTS.map((slot, i) => {
        const Icon = icons[(offset + i) % icons.length];
        const tilt = Math.round((random() * 2 - 1) * 18);
        return (
          <motion.span
            key={i}
            custom={i}
            variants={POP}
            className="absolute"
            style={slot.style}
          >
            <span
              className="ww-bob block"
              style={{
                animationDuration: `${3 + (i % 3) * 0.8}s`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              <Icon
                size={slot.size}
                strokeWidth={1.75}
                style={{ rotate: `${tilt}deg` }}
              />
            </span>
          </motion.span>
        );
      })}

      <span className="absolute inset-x-0 bottom-3 text-center text-xs tracking-[0.3em] opacity-50">
        — {pageNumber} —
      </span>
    </div>
  );
}
