import { MessageCard } from "@/components/messages/message-card";
import { StoredImage } from "@/components/messages/stored-image";
import { Decorations } from "@/components/reveal/decorations";
import type { RevealProps } from "@/components/reveal/reveal-experience";
import { boardSummary } from "@/lib/format";
import { seedFromString } from "@/lib/seeded-random";
import { resolveTemplate, type TemplateConfig } from "@/templates";
import { boardSurfaceStyle, headingStyle } from "@/templates/styles";

/**
 * The board as printed pages (the PDF export renders this): a cover with the
 * recipient, title and template art, then every message in two columns.
 * Cards never split across pages (`.ww-sheet` in globals.css).
 */
export function PrintBoard({ board, messages }: RevealProps) {
  const template = resolveTemplate(board.templateId, board.occasion);
  const surface = boardSurfaceStyle(template);

  return (
    // data-print-ready tells the PDF renderer the streamed content is in.
    <div
      data-print-ready
      className="mx-auto w-full max-w-4xl print:max-w-none print:[box-decoration-break:clone] print:p-[12mm]"
      style={{ color: surface.color, fontFamily: surface.fontFamily }}
    >
      <style>{pageBackground(template)}</style>

      <section className="relative flex h-dvh break-after-page flex-col items-center justify-center overflow-hidden px-8 text-center print:h-[calc(100vh-24mm)]">
        <Decorations
          template={template}
          seed={seedFromString(board.id)}
          density={0.6}
          still
        />
        <div className="relative">
          {board.recipientPhotoUrl ? (
            <div className="mx-auto mb-8 size-40 overflow-hidden rounded-full border-4 border-white/80 shadow-xl">
              <StoredImage
                src={board.recipientPhotoUrl}
                alt={board.recipientName}
                width={320}
                height={320}
                sizes="160px"
                priority
                className="size-full object-cover"
              />
            </div>
          ) : null}
          <p className="text-sm tracking-[0.2em] uppercase opacity-80">
            For {board.recipientName}
          </p>
          <h1
            className="mt-4 text-6xl leading-tight text-balance"
            style={headingStyle(template)}
          >
            {board.title}
          </h1>
          {board.intro ? (
            <p className="mx-auto mt-6 max-w-lg text-lg whitespace-pre-line">
              {board.intro}
            </p>
          ) : null}
          <p className="mt-6 text-sm opacity-80">
            {boardSummary(
              messages.map((m) => m.authorName),
              board.eventDateLabel,
            )}
          </p>
        </div>
        <p className="absolute inset-x-0 bottom-6 text-xs opacity-60 print:bottom-0">
          Made with WishWall
        </p>
      </section>

      <main className="py-8 print:py-0">
        <h2 className="sr-only">Messages</h2>
        {messages.length > 0 ? (
          <ul className="columns-2 gap-5">
            {messages.map((message) => (
              <li key={message.id} className="mb-5 break-inside-avoid">
                <MessageCard
                  message={message}
                  template={template}
                  tiltSeed={message.id}
                  eagerImage
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-16 text-center text-lg opacity-80">
            No messages yet.
          </p>
        )}
      </main>
    </div>
  );
}

/**
 * Paints the template background on the root element. Page margins are zero
 * (Chromium leaves margins blank) and the wrapper's padding, cloned onto
 * every page, stands in for them, so each printed page is full-bleed.
 */
function pageBackground(t: TemplateConfig): string {
  const declarations = [
    `background-color: ${t.colors.background};`,
    t.colors.backgroundImage
      ? `background-image: ${t.colors.backgroundImage};`
      : "",
    t.colors.backgroundSize
      ? `background-size: ${t.colors.backgroundSize};`
      : "",
  ].join(" ");
  return `html { ${declarations} } body { background: transparent; } @page { margin: 0; }`;
}
