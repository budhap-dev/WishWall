"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { VisibilityFields } from "@/components/boards/visibility-fields";
import { Field } from "@/components/form/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BOARD_LIMITS, type BoardDetailsInput } from "@/lib/validation/board";
import { updateBoardDetailsAction } from "@/server/actions/boards";

type Props = { boardId: string; initial: BoardDetailsInput };

export function BoardDetailsForm({ boardId, initial }: Props) {
  const [values, setValues] = useState<BoardDetailsInput>(initial);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pending, startTransition] = useTransition();

  const update = (patch: Partial<BoardDetailsInput>) =>
    setValues((v) => ({ ...v, ...patch }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateBoardDetailsAction(boardId, values);
      if (result.ok) {
        setErrors({});
        toast.success("Board details saved");
      } else {
        setErrors(
          Object.fromEntries(
            Object.entries(result.fieldErrors ?? {}).map(([k, v]) => [
              k,
              v?.[0],
            ]),
          ),
        );
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={save} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="recipientName"
          label="Recipient's name"
          error={errors.recipientName}
        >
          {(aria) => (
            <Input
              {...aria}
              maxLength={BOARD_LIMITS.recipientName}
              value={values.recipientName}
              onChange={(e) => update({ recipientName: e.target.value })}
            />
          )}
        </Field>
        <Field
          id="eventDate"
          label="Event date (optional)"
          error={errors.eventDate}
        >
          {(aria) => (
            <Input
              {...aria}
              type="date"
              className="w-auto"
              value={values.eventDate}
              onChange={(e) => update({ eventDate: e.target.value })}
            />
          )}
        </Field>
      </div>
      <Field id="title" label="Board title" error={errors.title}>
        {(aria) => (
          <Input
            {...aria}
            maxLength={BOARD_LIMITS.title}
            value={values.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        )}
      </Field>
      <Field
        id="intro"
        label="Intro message (optional)"
        description={`${values.intro.length}/${BOARD_LIMITS.intro}`}
        error={errors.intro}
      >
        {(aria) => (
          <Textarea
            {...aria}
            rows={4}
            maxLength={BOARD_LIMITS.intro}
            value={values.intro}
            onChange={(e) => update({ intro: e.target.value })}
          />
        )}
      </Field>
      <VisibilityFields
        allowGuests={values.allowGuests}
        messagesVisible={values.messagesVisible}
        onChange={update}
      />
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : null}
        Save details
      </Button>
    </form>
  );
}
