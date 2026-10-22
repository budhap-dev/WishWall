"use client";

import { Download } from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PAGES_MESSAGE, type PaperSize } from "@/lib/print-layout";
import { cn } from "@/lib/utils";

const PAPERS: { id: PaperSize; label: string; detail: string }[] = [
  { id: "a4", label: "A4", detail: "210 × 297 mm" },
  { id: "letter", label: "US Letter", detail: "8.5 × 11 in" },
];

type Props = {
  /** The board's reveal slug (the PDF is the finished board). */
  revealSlug: string;
  variant?: "default" | "outline";
  className?: string;
  style?: CSSProperties;
};

/**
 * Opens a preview of the card's printed pages (the print page, in a frame:
 * exactly what the PDF will hold), with the paper size to choose and the
 * download. Rendering the PDF takes a few seconds, so it fetches with a
 * progress toast rather than a plain link.
 */
export function DownloadPdfButton({
  revealSlug,
  variant = "outline",
  className,
  style,
}: Props) {
  const [open, setOpen] = useState(false);
  const [paper, setPaper] = useState<PaperSize>("a4");
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // The framed print page reports its page count once it's laid out.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.data?.type === PAGES_MESSAGE
      ) {
        setPageCount(event.data.count);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function choosePaper(next: PaperSize) {
    if (next === paper) return;
    setPaper(next);
    setPageCount(null);
  }

  async function download() {
    setBusy(true);
    const toastId = toast.loading("Preparing your PDF…");
    try {
      const res = await fetch(`/board/${revealSlug}/pdf?paper=${paper}`);
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          body?.error ?? "Couldn't create the PDF. Please try again.",
        );
      }
      const url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = filenameFrom(res.headers.get("Content-Disposition"));
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      toast.success("PDF downloaded", { id: toastId });
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Couldn't create the PDF. Please try again.",
        { id: toastId },
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          className={cn("print:hidden", className)}
          style={style}
        >
          <Download /> Download PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[92dvh] max-w-[calc(100%-1rem)] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="p-4 pr-12">
          <DialogTitle>Preview your card</DialogTitle>
          <DialogDescription>
            {pageCount ? `${pageCount} pages` : "Laying out the pages…"}
            {" · "}exactly what the PDF will look like.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <iframe
            key={paper}
            src={`/board/${revealSlug}/print?paper=${paper}`}
            title="Card preview"
            className="min-h-0 w-full flex-1 border-y bg-stone-200"
          />
        ) : null}
        <DialogFooter className="m-0 items-center rounded-b-xl border-t-0 sm:justify-between">
          <div
            role="radiogroup"
            aria-label="Paper size"
            className="flex w-full gap-1 rounded-lg bg-muted p-1 sm:w-auto"
          >
            {PAPERS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={paper === p.id}
                onClick={() => choosePaper(p.id)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-none",
                  paper === p.id
                    ? "bg-background font-medium shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {p.detail}
                </span>
              </button>
            ))}
          </div>
          <Button
            onClick={() => void download()}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            <Download /> {busy ? "Preparing PDF…" : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The server's filename (UTF-8 form preferred), or a generic one. */
function filenameFrom(disposition: string | null): string {
  const utf8 = disposition?.match(/filename\*=UTF-8''([^;]+)/)?.[1];
  if (utf8) {
    try {
      return decodeURIComponent(utf8);
    } catch {
      // Fall through to the plain name.
    }
  }
  return disposition?.match(/filename="([^"]+)"/)?.[1] ?? "card.pdf";
}
