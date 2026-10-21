import "server-only";
import { ImageResponse } from "next/og";
import { contrastRatio } from "@/lib/color";
import type { TemplateConfig } from "@/templates";
import { GOOGLE_FONT_FAMILY } from "@/templates/font-families";

/**
 * Link-preview images (WhatsApp, iMessage, Slack…) for board links, drawn in
 * the board's template. Messaging apps fetch these once per link.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const fontCache = new Map<string, Promise<ArrayBuffer | null>>();

/**
 * Fetches a Google font subset containing just `text`, as TTF (Satori, which
 * renders these images, can't use WOFF2). Cached per instance; returns null on
 * failure so the image still renders in the default font.
 */
function loadGoogleFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}:${text}`;
  let cached = fontCache.get(key);
  if (!cached) {
    cached = (async () => {
      try {
        const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
        const css = await (await fetch(url)).text();
        const src = css.match(
          /src: url\((.+?)\) format\('(opentype|truetype)'\)/,
        )?.[1];
        if (!src) return null;
        const response = await fetch(src);
        return response.ok ? await response.arrayBuffer() : null;
      } catch {
        return null;
      }
    })();
    if (fontCache.size > 200) fontCache.clear();
    fontCache.set(key, cached);
  }
  return cached;
}

async function fontsFor(
  template: TemplateConfig,
  headingText: string,
  bodyText: string,
  handwrittenText = "",
) {
  const [headingData, bodyData, handData] = await Promise.all([
    loadGoogleFont(
      GOOGLE_FONT_FAMILY[template.fonts.heading],
      400,
      headingText,
    ),
    loadGoogleFont(GOOGLE_FONT_FAMILY[template.fonts.body], 700, bodyText),
    handwrittenText
      ? loadGoogleFont("Caveat", 500, handwrittenText)
      : Promise.resolve(null),
  ]);
  const fonts: {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 500 | 700;
    style: "normal";
  }[] = [];
  if (headingData)
    fonts.push({
      name: "Heading",
      data: headingData,
      weight: 400,
      style: "normal",
    });
  if (bodyData)
    fonts.push({ name: "Body", data: bodyData, weight: 700, style: "normal" });
  if (handData)
    fonts.push({ name: "Hand", data: handData, weight: 500, style: "normal" });
  return fonts;
}

// The same layered "sheet" shadow and light falloff the real cards use
// (see .ww-sheet / .ww-paper in globals.css), in Satori-compatible form.
const SHEET_SHADOW =
  "0 2px 3px rgba(0,0,0,0.10), 0 10px 18px -4px rgba(0,0,0,0.16), 0 30px 44px -14px rgba(0,0,0,0.32)";
const PAPER_LIGHT =
  "linear-gradient(165deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.04) 100%)";

/** Generic sample lines for the preview notes: never real messages (surprise mode). */
const SAMPLE_NOTES = [
  "With love ♥",
  "Can't wait to celebrate!",
  "Your message here…",
];

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** A small paper note in a template card colour, with a handwritten line. */
function Note(props: {
  template: TemplateConfig;
  colorIndex: number;
  text: string;
  rotate: number;
  left: number;
  top: number;
  dashed?: boolean;
}) {
  const color = Object.values(props.template.cards.palette)[props.colorIndex]!;
  return (
    <div
      style={{
        position: "absolute",
        left: props.left,
        top: props.top,
        width: 250,
        height: 150,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "22px 24px",
        borderRadius: Math.min(props.template.cards.radius, 12),
        backgroundColor: color.background,
        backgroundImage: PAPER_LIGHT,
        boxShadow: SHEET_SHADOW,
        transform: `rotate(${props.rotate}deg)`,
        color: color.text,
        border: props.dashed ? `3px dashed ${color.text}55` : "none",
      }}
    >
      <div style={{ fontFamily: "Hand", fontSize: 36, lineHeight: 1.1 }}>
        {props.text}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <div
          style={{
            height: 6,
            width: "80%",
            borderRadius: 3,
            backgroundColor: color.text,
            opacity: 0.16,
          }}
        />
        <div
          style={{
            height: 6,
            width: "55%",
            borderRadius: 3,
            backgroundColor: color.text,
            opacity: 0.16,
          }}
        />
      </div>
    </div>
  );
}

/**
 * Preview for the contribute link: the board as a paper greeting card, with
 * a few notes fanned beside it and a call to action, in the board's template.
 */
export async function contributeOgImage(opts: {
  template: TemplateConfig;
  title: string;
  recipientName: string;
  messageCount: number;
}) {
  const { template } = opts;
  const title = truncate(opts.title, 60);
  const kicker = `A group card for ${truncate(opts.recipientName, 40)}`;
  const cta = "Add your message";
  const count =
    opts.messageCount > 0
      ? `${opts.messageCount} ${opts.messageCount === 1 ? "person has" : "people have"} signed`
      : "Be the first to sign";
  const fonts = await fontsFor(
    template,
    title,
    `${kicker}${cta}${count}WishWall`,
    SAMPLE_NOTES.join(""),
  );
  // The main card uses the template's first card colour, so dark templates
  // still get a light sheet to write on.
  const sheet = template.cards.palette.c1;
  // Title colour: the accent if it's readable on the sheet (large text, 3:1),
  // else the heading colour, else the sheet's own text colour.
  const titleColor =
    [template.colors.accent, template.colors.heading].find(
      (c) => contrastRatio(c, sheet.background) >= 3,
    ) ?? sheet.text;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: template.colors.background,
        // Satori rejects undefined style values, so only add the key when set.
        ...(template.colors.backgroundImage?.startsWith("linear-gradient")
          ? { backgroundImage: template.colors.backgroundImage }
          : {}),
        fontFamily: "Body",
      }}
    >
      {/* The greeting card itself */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: 58,
          width: 640,
          height: 470,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 52px",
          gap: 18,
          borderRadius: Math.min(template.cards.radius, 14),
          backgroundColor: sheet.background,
          backgroundImage: PAPER_LIGHT,
          boxShadow: SHEET_SHADOW,
          transform: "rotate(-1.5deg)",
          color: sheet.text,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, opacity: 0.75 }}>
          {kicker}
        </div>
        <div
          style={{
            fontFamily: "Heading",
            fontSize: title.length > 32 ? 60 : 74,
            lineHeight: 1.1,
            color: titleColor,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "14px 30px",
              flexShrink: 0,
              whiteSpace: "nowrap",
              borderRadius: 999,
              fontSize: 30,
              fontWeight: 700,
              backgroundColor: template.colors.accent,
              color: template.colors.accentText,
            }}
          >
            {cta}
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, opacity: 0.7 }}>
            {count}
          </div>
        </div>
      </div>

      {/* Notes fanned beside it */}
      <Note
        template={template}
        colorIndex={1}
        text={SAMPLE_NOTES[0]!}
        rotate={6}
        left={790}
        top={46}
      />
      <Note
        template={template}
        colorIndex={2}
        text={SAMPLE_NOTES[1]!}
        rotate={-4}
        left={760}
        top={232}
      />
      <Note
        template={template}
        colorIndex={4}
        text={SAMPLE_NOTES[2]!}
        rotate={3}
        left={810}
        top={410}
        dashed
      />

      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: 64,
          fontSize: 22,
          fontWeight: 700,
          color: template.colors.text,
          opacity: 0.55,
        }}
      >
        WishWall
      </div>
    </div>,
    { ...OG_SIZE, fonts },
  );
}

export async function revealOgImage(opts: {
  template: TemplateConfig;
  recipientName: string;
}) {
  const { template } = opts;
  const name = truncate(opts.recipientName, 40);
  const fonts = await fontsFor(template, name, "A card forTap to openWishWall");
  const accent = template.colors.accent;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        backgroundColor: template.colors.background,
        color: template.colors.text,
        fontFamily: "Body",
      }}
    >
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 6,
          opacity: 0.75,
        }}
      >
        A card for
      </div>
      <div
        style={{
          fontFamily: "Heading",
          fontSize: 92,
          color: template.colors.heading,
          lineHeight: 1,
        }}
      >
        {name}
      </div>
      <div
        style={{
          display: "flex",
          position: "relative",
          width: 360,
          height: 230,
          marginTop: 34,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 360,
            height: 230,
            borderRadius: 16,
            backgroundColor: accent,
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          }}
        />
        {/* flap: a rotated square clipped by the envelope's top edge */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 360,
            height: 230,
            display: "flex",
            overflow: "hidden",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 55,
              top: -195,
              width: 250,
              height: 250,
              transform: "rotate(45deg)",
              backgroundColor: "rgba(255,255,255,0.18)",
            }}
          />
        </div>
        <div
          style={{
            position: "absolute",
            left: 155,
            top: 90,
            width: 50,
            height: 50,
            borderRadius: 25,
            // light palette colour: always visible against the accent
            backgroundColor: template.cards.palette.c5.background,
            border: "4px solid rgba(255,255,255,0.6)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 28,
          right: 40,
          fontSize: 24,
          fontWeight: 700,
          opacity: 0.55,
        }}
      >
        WishWall
      </div>
    </div>,
    { ...OG_SIZE, fonts },
  );
}
