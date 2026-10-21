"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { OccasionPicker } from "@/components/boards/occasion-picker";
import { TemplatePicker } from "@/components/boards/template-picker";
import { Button } from "@/components/ui/button";
import type { Occasion } from "@/lib/occasions";
import { updateBoardAppearanceAction } from "@/server/actions/boards";
import { defaultTemplateFor, isTemplateForOccasion } from "@/templates";

type Props = {
  boardId: string;
  title: string;
  initial: { occasion: Occasion; templateId: string };
};

export function BoardAppearanceForm({ boardId, title, initial }: Props) {
  const [occasion, setOccasion] = useState(initial.occasion);
  const [templateId, setTemplateId] = useState(
    isTemplateForOccasion(initial.templateId, initial.occasion)
      ? initial.templateId
      : defaultTemplateFor(initial.occasion).id,
  );
  const [pending, startTransition] = useTransition();
  const dirty =
    occasion !== initial.occasion || templateId !== initial.templateId;

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateBoardAppearanceAction(boardId, {
        occasion,
        templateId,
      });
      if (result.ok) toast.success("Template updated");
      else toast.error(result.error);
    });
  }

  return (
    <form onSubmit={save} className="space-y-8">
      <OccasionPicker
        legend="Occasion"
        value={occasion}
        onChange={(next) => {
          setOccasion(next);
          setTemplateId(defaultTemplateFor(next).id);
        }}
      />
      <TemplatePicker
        legend="Template"
        occasion={occasion}
        value={templateId}
        onChange={setTemplateId}
        previewTitle={title}
      />
      <Button type="submit" disabled={pending || !dirty}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Save template
      </Button>
    </form>
  );
}
