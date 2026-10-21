"use client";

import { ChevronDown, Download } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const PAPERS = [
  { id: "a4", label: "A4", detail: "210 × 297 mm" },
  { id: "letter", label: "US Letter", detail: "8.5 × 11 in" },
] as const;

type Props = {
  /** The board's reveal slug (the PDF is the finished board). */
  revealSlug: string;
  variant?: "default" | "outline";
  className?: string;
  style?: CSSProperties;
};

/**
 * Downloads the board as a PDF in the chosen paper size. Rendering takes a
 * few seconds, so it fetches with a progress toast rather than a plain link.
 */
export function DownloadPdfButton({
  revealSlug,
  variant = "outline",
  className,
  style,
}: Props) {
  const [busy, setBusy] = useState(false);

  async function download(paper: (typeof PAPERS)[number]["id"]) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={busy}>
        <Button
          variant={variant}
          className={cn("print:hidden", className)}
          style={style}
        >
          <Download /> {busy ? "Preparing PDF…" : "Download PDF"}
          <ChevronDown data-icon="inline-end" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {PAPERS.map((p) => (
          <DropdownMenuItem key={p.id} onSelect={() => void download(p.id)}>
            {p.label}
            <span className="ml-auto pl-4 text-xs text-muted-foreground">
              {p.detail}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
