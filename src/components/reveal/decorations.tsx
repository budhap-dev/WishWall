import type { CSSProperties, ReactNode } from "react";
import { seededRandom } from "@/lib/seeded-random";
import { cn } from "@/lib/utils";
import type { Decoration, TemplateConfig } from "@/templates";

type Motion = "fall" | "rise" | "twinkle" | "glide";

type Spec = {
  count: number;
  motion: Motion;
  size: [number, number]; // px range
  duration: [number, number]; // seconds range
  shape: (color: string, r: () => number) => ReactNode;
};

// Each decoration: how many particles, how they move, and what they look like.
const SPECS: Record<Exclude<Decoration, "none">, Spec> = {
  confetti: {
    count: 42,
    motion: "fall",
    size: [8, 14],
    duration: [7, 13],
    shape: (c, r) =>
      r() < 0.5 ? (
        <rect x="2" y="0" width="6" height="10" rx="1.5" fill={c} />
      ) : (
        <circle cx="5" cy="5" r="4" fill={c} />
      ),
  },
  balloons: {
    count: 11,
    motion: "rise",
    size: [38, 66],
    duration: [16, 26],
    shape: (c) => (
      <>
        <path
          d="M5 10.5 Q5.6 14 4.2 18"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="0.4"
          fill="none"
        />
        <ellipse cx="5" cy="5" rx="4" ry="5" fill={c} />
        <path d="M4.4 10.2 L5.6 10.2 L5 9.4 Z" fill={c} />
        <ellipse
          cx="3.6"
          cy="3.4"
          rx="0.9"
          ry="1.5"
          fill="white"
          fillOpacity="0.45"
        />
      </>
    ),
  },
  hearts: {
    count: 16,
    motion: "rise",
    size: [14, 30],
    duration: [11, 19],
    shape: (c) => (
      <path
        d="M5 9 C1 6 0 4 1.2 2.2 C2.3 0.6 4.2 1 5 2.6 C5.8 1 7.7 0.6 8.8 2.2 C10 4 9 6 5 9 Z"
        fill={c}
      />
    ),
  },
  leaves: {
    count: 16,
    motion: "fall",
    size: [16, 28],
    duration: [11, 19],
    shape: (c) => (
      <>
        <path d="M1 9 C1 4 4 1 9 1 C9 6 6 9 1 9 Z" fill={c} />
        <path
          d="M1 9 L7 3"
          stroke="white"
          strokeOpacity="0.5"
          strokeWidth="0.5"
        />
      </>
    ),
  },
  stars: {
    count: 46,
    motion: "twinkle",
    size: [4, 12],
    duration: [2.5, 5],
    shape: (c) => (
      <path
        d="M5 0 L6.2 3.6 L10 3.8 L7 6.1 L8.1 9.8 L5 7.6 L1.9 9.8 L3 6.1 L0 3.8 L3.8 3.6 Z"
        fill={c}
      />
    ),
  },
  sparkles: {
    count: 26,
    motion: "twinkle",
    size: [8, 18],
    duration: [2, 4.5],
    shape: (c) => (
      <path
        d="M5 0 Q5.6 4.4 10 5 Q5.6 5.6 5 10 Q4.4 5.6 0 5 Q4.4 4.4 5 0 Z"
        fill={c}
      />
    ),
  },
  petals: {
    count: 24,
    motion: "fall",
    size: [10, 18],
    duration: [9, 16],
    shape: (c) => (
      <ellipse cx="5" cy="5" rx="3" ry="5" fill={c} fillOpacity="0.9" />
    ),
  },
  bubbles: {
    count: 18,
    motion: "rise",
    size: [14, 40],
    duration: [12, 22],
    shape: (c) => (
      <>
        <circle
          cx="5"
          cy="5"
          r="4.4"
          fill={c}
          fillOpacity="0.18"
          stroke={c}
          strokeWidth="0.5"
        />
        <circle cx="3.4" cy="3.4" r="0.9" fill="white" fillOpacity="0.7" />
      </>
    ),
  },
  streamers: {
    count: 14,
    motion: "fall",
    size: [18, 34],
    duration: [8, 14],
    shape: (c) => (
      <path
        d="M2 0 C8 2 -2 5 5 7 C10 8.5 3 9.5 6 10"
        stroke={c}
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    ),
  },
  planes: {
    count: 5,
    motion: "glide",
    size: [26, 40],
    duration: [16, 26],
    shape: (c) => (
      <>
        <path d="M0 5 L10 1 L6 9 L4.6 6 Z" fill={c} />
        <path
          d="M4.6 6 L10 1"
          stroke="white"
          strokeOpacity="0.6"
          strokeWidth="0.4"
        />
      </>
    ),
  },
};

function range(r: () => number, [min, max]: [number, number]) {
  return min + r() * (max - min);
}

type Props = {
  template: TemplateConfig;
  /** Varies the layout per board while staying identical on server and client. */
  seed: number;
  /** Fewer particles, e.g. behind the opener or for reduced motion. */
  density?: number;
  /** Scatter the particles, unmoving, over the parent instead of the screen (print cover). */
  still?: boolean;
};

/**
 * Ambient decoration layer behind the reveal (confetti, balloons, …).
 * Purely decorative: aria-hidden, no pointer events, and frozen by CSS under
 * prefers-reduced-motion. Twinkling decorations then stay as a static pattern;
 * moving ones are left out by the caller.
 */
export function Decorations({
  template,
  seed,
  density = 1,
  still = false,
}: Props) {
  if (template.decoration === "none") return null;
  const spec = SPECS[template.decoration];
  const r = seededRandom(seed);
  const colors = [
    template.colors.accent,
    template.colors.heading,
    ...Object.values(template.cards.palette).map((c) => c.background),
  ];
  const count = Math.round(spec.count * density);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0 overflow-hidden",
        still ? "absolute" : "fixed print:hidden",
      )}
      style={{ color: template.colors.text }}
    >
      {Array.from({ length: count }, (_, i) => {
        const size = range(r, spec.size);
        const duration = range(r, spec.duration);
        const style = {
          "--x": `${(r() * 100).toFixed(2)}%`,
          "--y": `${(r() * 100).toFixed(2)}%`,
          "--dur": `${duration.toFixed(2)}s`,
          // Negative delays start each particle part-way through its loop,
          // so the screen is already populated instead of filling up slowly.
          "--delay": `${(-r() * duration).toFixed(2)}s`,
          "--drift": `${((r() - 0.5) * 120).toFixed(0)}px`,
          "--spin": `${((r() - 0.5) * 900).toFixed(0)}deg`,
          width: size,
          height:
            spec.motion === "rise" && template.decoration === "balloons"
              ? size * 1.8
              : size,
        } as CSSProperties;
        const color = colors[Math.floor(r() * colors.length)]!;
        return (
          <svg
            key={i}
            className={cn(
              "ww-particle",
              still ? "ww-still" : `ww-${spec.motion}`,
            )}
            style={style}
            viewBox={
              template.decoration === "balloons" ? "0 0 10 18" : "0 0 10 10"
            }
            overflow="visible"
          >
            {spec.shape(color, r)}
          </svg>
        );
      })}
    </div>
  );
}

/** Whether a decoration keeps meaning when motion is reduced (static twinklers do). */
export function isStaticFriendly(decoration: Decoration): boolean {
  return decoration === "stars" || decoration === "sparkles";
}
