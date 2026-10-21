"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ACCEPTED_IMAGE_TYPES,
  type UploadResult,
  uploadImage,
} from "@/lib/client/upload";
import { cn } from "@/lib/utils";
import { StoredImage } from "./stored-image";

export type ImageValue = Omit<UploadResult, "token"> & {
  token: string;
  alt: string;
};

type Props = {
  value: ImageValue | null;
  onChange: (value: ImageValue | null) => void;
  purpose: "messages" | "recipients";
  boardShareSlug?: string;
  label: string;
  /** Ask for alt text (message photos); recipient photos use the name instead. */
  withAlt?: boolean;
  /** Called while an upload is in flight, so forms can block submit. */
  onBusyChange?: (busy: boolean) => void;
  round?: boolean;
};

export function ImageUploadField({
  value,
  onChange,
  purpose,
  boardShareSlug,
  label,
  withAlt,
  onBusyChange,
  round,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const altId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    onBusyChange?.(true);
    try {
      const uploaded = await uploadImage(file, purpose, boardShareSlug);
      onChange({ ...uploaded, alt: value?.alt ?? "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The upload failed.");
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = ""; // allow re-picking the same file
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "relative shrink-0 overflow-hidden border bg-muted",
              round ? "size-20 rounded-full" : "max-h-48 w-40 rounded-lg",
            )}
          >
            <StoredImage
              src={value.url}
              alt={value.alt || "Selected image"}
              width={value.width}
              height={value.height}
              sizes="160px"
              className={cn("h-auto w-full", round && "size-full object-cover")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}{" "}
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onChange(null)}
            >
              <X /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="w-full justify-center border-dashed py-6"
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <ImagePlus /> Add a photo or GIF
            </>
          )}
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {value && withAlt ? (
        <div className="space-y-1">
          <Label htmlFor={altId} className="text-xs">
            Describe the image (for screen readers)
          </Label>
          <Input
            id={altId}
            maxLength={200}
            placeholder="e.g. Maya and me at the beach"
            value={value.alt}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
