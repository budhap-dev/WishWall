import "server-only";
import { ImageResponse } from "next/og";
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
) {
  const heading = GOOGLE_FONT_FAMILY[template.fonts.heading];
  const body = GOOGLE_FONT_FAMILY[template.fonts.body];
  const [headingData, bodyData] = await Promise.all([
    loadGoogleFont(heading, 400, headingText),
    loadGoogleFont(body, 700, bodyText),
  ]);
  const fonts: {
    name: string;
    data: ArrayBuffer;
    weight: 400 | 700;
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
  return fonts;
}

/** A little fan of blank cards in the template's palette, hinting at the board. */
function CardFan({ template }: { template: TemplateConfig }) {
  const palette = Object.values(template.cards.palette);
  const cards = [
    { color: palette[0]!, rotate: -10, left: 0, top: 40 },
    { color: palette[1]!, rotate: 4, left: 120, top: 0 },
    { color: palette[2]!, rotate: -3, left: 70, top: 170 },
    { color: palette[3]!, rotate: 9, left: 200, top: 140 },
  ];
  return (
    <div
      style={{ display: "flex", position: "relative", width: 400, height: 380 }}
    >
      {cards.map((card, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: card.left,
            top: card.top,
            width: 190,
            height: 170,
            borderRadius: 14,
            backgroundColor: card.color.background,
            transform: `rotate(${card.rotate}deg)`,
            boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            padding: 22,
            gap: 12,
          }}
        >
          {[0.9, 0.75, 0.55].map((w, j) => (
            <div
              key={j}
              style={{
                height: 10,
                width: `${w * 100}%`,
                borderRadius: 5,
                backgroundColor: card.color.text,
                opacity: 0.25,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Preview for the contribute link: title, who it's for, and a call to action. */
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
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "0 70px",
        gap: 40,
        backgroundColor: template.colors.background,
        color: template.colors.text,
        fontFamily: "Body",
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", flex: 1, gap: 22 }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, opacity: 0.8 }}>
          {kicker}
        </div>
        <div
          style={{
            fontFamily: "Heading",
            fontSize: title.length > 32 ? 64 : 80,
            lineHeight: 1.1,
            color: template.colors.heading,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "16px 32px",
              borderRadius: 999,
              fontSize: 32,
              fontWeight: 700,
              backgroundColor: template.colors.accent,
              color: template.colors.accentText,
            }}
          >
            {cta}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, opacity: 0.75 }}>
            {count}
          </div>
        </div>
      </div>
      <CardFan template={template} />
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

/** Preview for the recipient's link: a sealed envelope, no spoilers. */
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
