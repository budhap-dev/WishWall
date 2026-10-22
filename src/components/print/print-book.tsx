"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MessageCard } from "@/components/messages/message-card";
import { StoredImage } from "@/components/messages/stored-image";
import { Decorations } from "@/components/reveal/decorations";
import type { RevealProps } from "@/components/reveal/reveal-experience";
import { LogoMark } from "@/components/site/logo";
import { boardSummary } from "@/lib/format";
import {
  COLUMN_WIDTH,
  CONTENT_WIDTH,
  contentHeight,
  layoutPages,
  PAGE_HEIGHT,
  PAGE_PADDING,
  PAGE_WIDTH,
  PAGES_MESSAGE,
  type PaperSize,
  type Placement,
  PRINT_ZOOM,
} from "@/lib/print-layout";
import { seedFromString } from "@/lib/seeded-random";
import type { MessageView } from "@/server/services/messages";
import { resolveTemplate, type TemplateConfig } from "@/templates";
import { boardSurfaceStyle, headingStyle } from "@/templates/styles";

type Props = RevealProps & { paper: PaperSize };

/**
 * The board as a printed card: a cover, the messages packed onto pages the
 * way the reveal wall shows them. Pages are laid out here
 * (cards are measured first, then placed), so the download preview and the
 * PDF, which both render this, show exactly the same pages.
 */
export function PrintBook({ board, messages, paper }: Props) {
  const template = resolveTemplate(board.templateId, board.occasion);
  const [pages, setPages] = useState<Placement[][] | null>(
    messages.length > 0 ? null : [],
  );
  const measurer = useRef<HTMLDivElement>(null);
  const zoom = useSyncExternalStore(
    subscribeResize,
    () => fitZoom(paper),
    () => 1,
  );
  const seed = seedFromString(board.id);

  // Measure every card once its fonts are in, then pack them onto pages.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      do await document.fonts.ready;
      while (document.fonts.status === "loading");
      const root = measurer.current;
      if (cancelled || !root) return;
      const heights = (width: string) =>
        new Map(
          Array.from(
            root.querySelectorAll<HTMLElement>(`[data-width="${width}"] > *`),
            (el) => [el.dataset.id, el.offsetHeight],
          ),
        );
      const column = heights("column");
      const full = heights("full");
      setPages(
        layoutPages(
          messages.map((m) => ({
            id: m.id,
            height: column.get(m.id) ?? 0,
            fullHeight: full.get(m.id) ?? 0,
          })),
          contentHeight(paper),
        ),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, paper]);

  useEffect(() => {
    if (pages && window.parent !== window) {
      window.parent.postMessage(
        { type: PAGES_MESSAGE, count: 1 + Math.max(pages.length, 1) },
        window.location.origin,
      );
    }
  }, [pages]);

  const byId = new Map(messages.map((m) => [m.id, m]));
  const pageStyle = {
    ...boardSurfaceStyle(template),
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT[paper],
  };

  return (
    // data-print-ready tells the PDF renderer the pages are laid out.
    <div data-print-ready={pages ? "" : undefined}>
      <style>{bookCss(paper)}</style>

      <div className="ww-book py-6 print:py-0" style={{ zoom }}>
        <Page style={pageStyle}>
          <Decorations template={template} seed={seed} density={0.6} still />
          <div className="relative flex h-full flex-col items-center justify-center px-20 text-center">
            {board.recipientPhotoUrl ? (
              <div className="mb-10 size-48 overflow-hidden rounded-full border-4 border-white/80 shadow-xl">
                <StoredImage
                  src={board.recipientPhotoUrl}
                  alt={board.recipientName}
                  width={384}
                  height={384}
                  sizes="192px"
                  priority
                  className="size-full object-cover"
                />
              </div>
            ) : null}
            <p className="text-base tracking-[0.2em] uppercase opacity-80">
              For {board.recipientName}
            </p>
            <h1
              className="mt-5 text-7xl leading-tight text-balance"
              style={headingStyle(template)}
            >
              {board.title}
            </h1>
            {board.intro ? (
              <p className="mt-8 max-w-2xl text-xl leading-relaxed whitespace-pre-line">
                {board.intro}
              </p>
            ) : null}
            <p className="mt-8 text-base opacity-80">
              {boardSummary(
                messages.map((m) => m.authorName),
                board.eventDateLabel,
              )}
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-12 flex flex-col items-center gap-2 opacity-80">
            <LogoMark className="size-9" />
            <p className="text-sm">Made with WishWall</p>
          </div>
        </Page>

        <h2 className="sr-only">Messages</h2>
        {pages?.map((placements, index) => (
          <Page key={index} style={pageStyle}>
            <Decorations
              template={template}
              seed={seed + index + 1}
              density={0.25}
              still
            />
            <ul
              className="absolute"
              style={{
                left: PAGE_PADDING.side,
                top: PAGE_PADDING.top,
                width: CONTENT_WIDTH,
                height: contentHeight(paper),
              }}
            >
              {placements.map((p) => (
                <li
                  key={p.id}
                  className="absolute origin-top-left"
                  style={{
                    left: p.x,
                    top: p.y,
                    width: p.width,
                    scale: p.scale === 1 ? undefined : p.scale,
                  }}
                >
                  <Card message={byId.get(p.id)!} template={template} />
                </li>
              ))}
            </ul>
            <p className="absolute inset-x-0 bottom-9 text-center text-sm opacity-60">
              {index + 2}
            </p>
          </Page>
        ))}
        {messages.length === 0 ? (
          <Page style={pageStyle}>
            <p className="flex h-full items-center justify-center text-xl opacity-80">
              No messages yet.
            </p>
          </Page>
        ) : null}
      </div>

      {/* Off-screen copies of every card, at column and full width, to measure. */}
      {pages === null ? (
        <div
          ref={measurer}
          aria-hidden="true"
          className="invisible fixed top-0 left-0 h-0 overflow-hidden"
          style={boardSurfaceStyle(template)}
        >
          {(["column", "full"] as const).map((width) => (
            <div
              key={width}
              data-width={width}
              style={{
                width: width === "column" ? COLUMN_WIDTH : CONTENT_WIDTH,
              }}
            >
              {messages.map((m) => (
                <div key={m.id} data-id={m.id}>
                  <Card message={m} template={template} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Page({
  style,
  children,
}: {
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <section
      className="relative mx-auto mb-6 overflow-hidden shadow-2xl not-last:break-after-page print:mb-0 print:shadow-none"
      style={style}
    >
      {children}
    </section>
  );
}

function Card({
  message,
  template,
}: {
  message: MessageView;
  template: TemplateConfig;
}) {
  return (
    <MessageCard
      message={message}
      template={template}
      tiltSeed={message.id}
      eagerImage
    />
  );
}

/** On screen, each page shrinks to fit the window (the download preview's frame) whole. */
function fitZoom(paper: PaperSize): number {
  return Math.min(
    1,
    (window.innerWidth - 32) / PAGE_WIDTH,
    (window.innerHeight - 32) / PAGE_HEIGHT[paper],
  );
}

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

/**
 * Screen: pages on a neutral desk, scrolling one page at a time. Print: no
 * margins (each page is full-bleed) and the design width zoomed to the
 * paper's width.
 */
function bookCss(paper: PaperSize): string {
  return `html { background: #e7e5e4; } body { background: transparent; }
@media screen { html { scroll-snap-type: y mandatory; } .ww-book > section { scroll-snap-align: center; } }
@page { size: ${paper === "letter" ? "letter" : "A4"}; margin: 0; }
@media print { html { background: none; } .ww-book { zoom: ${PRINT_ZOOM[paper]} !important; }
.ww-book .ww-sheet { box-shadow: 0 0 0 0.5px rgb(0 0 0 / 0.08), 0 2px 0 rgb(0 0 0 / 0.06), 0 4px 0 -1px rgb(0 0 0 / 0.05), 0 7px 0 -3px rgb(0 0 0 / 0.04); } }`;
}
