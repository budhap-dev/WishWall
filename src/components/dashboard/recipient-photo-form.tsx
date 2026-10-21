"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  type ImageValue,
  ImageUploadField,
} from "@/components/messages/image-upload-field";
import { setRecipientPhotoAction } from "@/server/actions/boards";

type Props = {
  boardId: string;
  initial: { url: string; key: string } | null;
};

/** Recipient photo: saved as soon as it's uploaded or removed. */
export function RecipientPhotoForm({ boardId, initial }: Props) {
  const [value, setValue] = useState<ImageValue | null>(
    initial
      ? { ...initial, width: 400, height: 400, token: "", alt: "" }
      : null,
  );

  async function onChange(next: ImageValue | null) {
    const previous = value;
    setValue(next);
    const result = await setRecipientPhotoAction(
      boardId,
      next
        ? {
            key: next.key,
            width: next.width,
            height: next.height,
            token: next.token,
          }
        : null,
    );
    if (result.ok) {
      toast.success(next ? "Photo saved" : "Photo removed");
    } else {
      setValue(previous);
      toast.error(result.error);
    }
  }

  return (
    <ImageUploadField
      label="Recipient photo (optional)"
      purpose="recipients"
      value={value}
      onChange={(next) => void onChange(next)}
      round
    />
  );
}
