"use client";

import { useAnimate } from "motion/react";
import { useState } from "react";
import type { TemplateConfig } from "@/templates";
import { fontFamily } from "@/templates/fonts";
import { boardSurfaceStyle, headingStyle } from "@/templates/styles";

export type OpenerProps = {
  template: TemplateConfig;
  recipientName: string;
  reducedMotion: boolean;
  /** Animation has started: mount the board underneath. */
  onOpening: () => void;
  /** Animation finished: remove the opener. */
  onOpened: () => void;
};

/** Picks the template's opener: envelope, gift box or curtain. */
export function Opener(props: OpenerProps) {
  switch (props.template.opener) {
    case "gift-box":
      return <GiftBoxOpener {...props} />;
    case "curtain":
      return <CurtainOpener {...props} />;
    default:
      return <EnvelopeOpener {...props} />;
  }
}

function useOpenSequence(
  { reducedMotion, onOpening, onOpened }: OpenerProps,
  sequence: (
    animate: ReturnType<typeof useAnimate>[1],
    root: HTMLDivElement,
  ) => Promise<void>,
) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const [busy, setBusy] = useState(false);
  async function open() {
    if (busy) return;
    setBusy(true);
    onOpening();
    if (!reducedMotion && scope.current) await sequence(animate, scope.current);
    onOpened();
  }
  return { scope, open, busy };
}

function Prompt({
  template,
  recipientName,
}: Pick<OpenerProps, "template" | "recipientName">) {
  return (
    <span className="block text-center">
      <span className="block text-sm tracking-[0.2em] uppercase opacity-80">
        A card for
      </span>
      <span
        className="mt-1 block text-4xl sm:text-5xl"
        style={headingStyle(template)}
      >
        {recipientName}
      </span>
    </span>
  );
}

function TapHint({ template }: { template: TemplateConfig }) {
  return (
    <span
      className="mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold shadow-md motion-safe:animate-pulse"
      style={{
        backgroundColor: template.colors.accent,
        color: template.colors.accentText,
      }}
    >
      Tap to open
    </span>
  );
}

const stage = "fixed inset-0 z-40 flex items-center justify-center p-6";
const openButton =
  "group flex flex-col items-center rounded-3xl p-4 outline-none focus-visible:ring-4 focus-visible:ring-current/40";

// ─── Envelope ──────────────────────────────────────────────────────────────

function EnvelopeOpener(props: OpenerProps) {
  const { template, recipientName } = props;
  const { scope, open, busy } = useOpenSequence(
    props,
    async (animate, root) => {
      await animate(
        "[data-flap]",
        { rotateX: 180 },
        { duration: 0.55, ease: "easeInOut" },
      );
      await animate("[data-flap]", { zIndex: 0 }, { duration: 0 });
      await animate(
        "[data-letter]",
        { y: "-58%" },
        { duration: 0.6, ease: "easeOut" },
      );
      await animate(
        root,
        { opacity: 0, scale: 1.12 },
        { duration: 0.45, ease: "easeIn" },
      );
    },
  );
  const accent = template.colors.accent;

  return (
    <div ref={scope} className={stage} style={boardSurfaceStyle(template)}>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className={openButton}
        aria-label={`Open your card for ${recipientName}`}
      >
        <Prompt template={template} recipientName={recipientName} />
        <span className="relative mt-8 block aspect-[3/2] w-[min(80vw,22rem)] [perspective:900px]">
          {/* back of the envelope */}
          <span
            className="absolute inset-0 rounded-lg shadow-2xl"
            style={{ backgroundColor: accent, filter: "brightness(0.85)" }}
          />
          {/* the letter, tucked inside */}
          <span
            data-letter
            className="absolute inset-x-[7%] top-[8%] bottom-[6%] flex items-start justify-center rounded-md bg-white pt-[9%] shadow"
            style={{
              fontFamily: fontFamily(template.fonts.heading),
              color: template.cards.palette.c1.text,
            }}
          >
            <span className="text-xl sm:text-2xl">♥</span>
          </span>
          {/* front pocket (two side flaps + bottom) */}
          <span
            className="absolute inset-0 rounded-lg"
            style={{
              backgroundColor: accent,
              clipPath: "polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)",
            }}
          />
          {/* top flap */}
          <span
            data-flap
            className="absolute inset-x-0 top-0 z-10 h-[58%] origin-top"
            style={{
              backgroundColor: accent,
              filter: "brightness(1.08)",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              backfaceVisibility: "hidden",
            }}
          />
          {/* wax seal */}
          <span
            className="absolute top-[46%] left-1/2 z-20 size-10 -translate-x-1/2 rounded-full border-2 border-white/60 shadow-md"
            style={{ backgroundColor: template.colors.heading }}
          />
        </span>
        <TapHint template={template} />
      </button>
    </div>
  );
}

// ─── Gift box ──────────────────────────────────────────────────────────────

function GiftBoxOpener(props: OpenerProps) {
  const { template, recipientName } = props;
  const { scope, open, busy } = useOpenSequence(
    props,
    async (animate, root) => {
      await animate(
        "[data-box]",
        { rotate: [0, -4, 4, -3, 3, 0] },
        { duration: 0.5 },
      );
      await animate(
        "[data-lid]",
        { y: -160, rotate: -28, opacity: 0 },
        { duration: 0.55, ease: "easeOut" },
      );
      await animate(
        root,
        { opacity: 0, scale: 1.1 },
        { duration: 0.45, ease: "easeIn" },
      );
    },
  );
  // A light palette colour, so the ribbon always contrasts with the box.
  const ribbon = template.cards.palette.c5.background;

  return (
    <div ref={scope} className={stage} style={boardSurfaceStyle(template)}>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className={openButton}
        aria-label={`Open your card for ${recipientName}`}
      >
        <Prompt template={template} recipientName={recipientName} />
        <span
          data-box
          className="relative mt-12 block h-44 w-52 sm:h-52 sm:w-60"
        >
          {/* box */}
          <span
            className="absolute inset-x-[6%] top-[22%] bottom-0 rounded-b-lg shadow-2xl"
            style={{ backgroundColor: template.colors.accent }}
          >
            <span
              className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2"
              style={{ backgroundColor: ribbon }}
            />
          </span>
          {/* lid with bow */}
          <span data-lid className="absolute inset-x-0 top-[10%] h-[18%]">
            <span
              className="absolute inset-0 rounded-md shadow-lg"
              style={{
                backgroundColor: template.colors.accent,
                filter: "brightness(1.1)",
              }}
            />
            <span
              className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2"
              style={{ backgroundColor: ribbon }}
            />
            <span
              className="absolute -top-7 left-1/2 h-8 w-10 -translate-x-[95%] -rotate-[25deg] rounded-full border-[6px]"
              style={{ borderColor: ribbon }}
            />
            <span
              className="absolute -top-7 left-1/2 h-8 w-10 -translate-x-[5%] rotate-[25deg] rounded-full border-[6px]"
              style={{ borderColor: ribbon }}
            />
          </span>
        </span>
        <TapHint template={template} />
      </button>
    </div>
  );
}

// ─── Curtain ───────────────────────────────────────────────────────────────

function CurtainOpener(props: OpenerProps) {
  const { template, recipientName } = props;
  const { scope, open, busy } = useOpenSequence(props, async (animate) => {
    await animate(
      "[data-label]",
      { opacity: 0, scale: 0.9 },
      { duration: 0.3 },
    );
    await Promise.all([
      animate(
        "[data-left]",
        { x: "-100%" },
        { duration: 1.1, ease: [0.65, 0, 0.35, 1] },
      ),
      animate(
        "[data-right]",
        { x: "100%" },
        { duration: 1.1, ease: [0.65, 0, 0.35, 1] },
      ),
    ]);
  });
  const fabric = {
    backgroundColor: template.colors.accent,
    backgroundImage:
      "repeating-linear-gradient(90deg, rgba(0,0,0,0.16) 0 6px, rgba(255,255,255,0.08) 6px 22px, rgba(0,0,0,0.12) 22px 30px)",
  };

  return (
    <div ref={scope} className="fixed inset-0 z-40 overflow-hidden">
      <span
        data-left
        className="absolute inset-y-0 left-0 w-1/2 shadow-2xl"
        style={fabric}
      />
      <span
        data-right
        className="absolute inset-y-0 right-0 w-1/2 shadow-2xl"
        style={fabric}
      />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <button
          data-label
          type="button"
          onClick={open}
          disabled={busy}
          className={`${openButton} bg-white/90 px-10 py-8 shadow-2xl`}
          style={{
            color: template.colors.text,
            fontFamily: fontFamily(template.fonts.body),
          }}
          aria-label={`Open your card for ${recipientName}`}
        >
          <Prompt template={template} recipientName={recipientName} />
          <TapHint template={template} />
        </button>
      </div>
    </div>
  );
}
