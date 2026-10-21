"use client";

import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { OccasionPicker } from "@/components/boards/occasion-picker";
import { TemplatePicker } from "@/components/boards/template-picker";
import { VisibilityFields } from "@/components/boards/visibility-fields";
import { Field } from "@/components/form/field";
import { TemplatePreview } from "@/components/templates/template-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { type Occasion, OCCASIONS, suggestTitle } from "@/lib/occasions";
import { cn } from "@/lib/utils";
import {
  BOARD_LIMITS,
  boardDetailsSchema,
  createBoardSchema,
} from "@/lib/validation/board";
import { createBoardAction } from "@/server/actions/boards";
import { defaultTemplateFor, getTemplate } from "@/templates";

const STEPS = [
  { key: "recipient", label: "Who it's for" },
  { key: "occasion", label: "Occasion" },
  { key: "template", label: "Template" },
  { key: "details", label: "Details" },
] as const;

type FieldErrors = Record<string, string | undefined>;

type State = {
  recipientName: string;
  occasion: Occasion | null;
  templateId: string;
  title: string;
  intro: string;
  eventDate: string;
  allowGuests: boolean;
  messagesVisible: boolean;
};

const INITIAL: State = {
  recipientName: "",
  occasion: null,
  templateId: "",
  title: "",
  intro: "",
  eventDate: "",
  allowGuests: true,
  messagesVisible: true,
};

export function CreateBoardWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<State>(INITIAL);
  const [titleEdited, setTitleEdited] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Move focus to the step heading on step change, so keyboard and screen
  // reader users land at the top of the new content.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const update = (patch: Partial<State>) =>
    setState((s) => ({ ...s, ...patch }));

  // Until the owner types a title, keep suggesting one from occasion + name.
  const suggestedTitle = state.occasion
    ? suggestTitle(state.occasion, state.recipientName)
    : "";
  const title = titleEdited ? state.title : suggestedTitle;

  const template =
    getTemplate(state.templateId) ??
    (state.occasion ? defaultTemplateFor(state.occasion) : null);

  function validateStep(index: number): boolean {
    const next: FieldErrors = {};
    if (index === 0) {
      const r = boardDetailsSchema.shape.recipientName.safeParse(
        state.recipientName,
      );
      if (!r.success) next.recipientName = r.error.issues[0]?.message;
    }
    if (index === 1 && !state.occasion) next.occasion = "Pick an occasion";
    if (index === 2 && !getTemplate(state.templateId))
      next.templateId = "Pick a template";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function selectOccasion(occasion: Occasion) {
    // Switching occasion resets the template to that occasion's default.
    update({ occasion, templateId: defaultTemplateFor(occasion).id });
  }

  function submit() {
    setFormError(null);
    const input = { ...state, title, occasion: state.occasion };
    const parsed = createBoardSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [String(i.path[0]), i.message]),
        ),
      );
      return;
    }
    startTransition(async () => {
      // On success the action redirects to the new board's page.
      const result = await createBoardAction(input);
      if (!result.ok) {
        setFormError(result.error);
        if (result.fieldErrors) {
          setErrors(
            Object.fromEntries(
              Object.entries(result.fieldErrors).map(([k, v]) => [k, v?.[0]]),
            ),
          );
        }
      }
    });
  }

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;
  const showPreview = step >= 2 && template;

  return (
    <div className="space-y-8">
      <nav aria-label="Progress">
        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {STEPS.map((s, i) => (
            <li
              key={s.key}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-2",
                i === step
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full border text-xs",
                  i < step &&
                    "border-primary bg-primary text-primary-foreground",
                  i === step && "border-primary text-primary",
                )}
                aria-hidden="true"
              >
                {i < step ? <Check className="size-3.5" /> : i + 1}
              </span>
              {s.label}
              {i < step ? <span className="sr-only">(completed)</span> : null}
            </li>
          ))}
        </ol>
      </nav>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isLast) submit();
          else goNext();
        }}
        noValidate
        className={cn(
          "grid gap-8",
          showPreview && "lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]",
        )}
      >
        <div className="space-y-6">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-heading text-2xl font-semibold outline-none"
          >
            {stepHeading(current.key, state)}
          </h2>

          {current.key === "recipient" ? (
            <Field
              id="recipientName"
              label="Recipient's name"
              description="This is how they'll be named on the board."
              error={errors.recipientName}
            >
              {(aria) => (
                <Input
                  {...aria}
                  autoFocus
                  autoComplete="off"
                  maxLength={BOARD_LIMITS.recipientName}
                  placeholder="e.g. Maya"
                  value={state.recipientName}
                  onChange={(e) => update({ recipientName: e.target.value })}
                />
              )}
            </Field>
          ) : null}

          {current.key === "occasion" ? (
            <div className="space-y-2">
              <OccasionPicker
                legend="Occasion"
                hideLegend
                value={state.occasion}
                onChange={selectOccasion}
              />
              {errors.occasion ? (
                <p className="text-sm font-medium text-destructive">
                  {errors.occasion}
                </p>
              ) : null}
            </div>
          ) : null}

          {current.key === "template" && state.occasion ? (
            <div className="space-y-2">
              <TemplatePicker
                legend="Template"
                hideLegend
                occasion={state.occasion}
                value={state.templateId}
                onChange={(templateId) => update({ templateId })}
                previewTitle={title}
              />
              {errors.templateId ? (
                <p className="text-sm font-medium text-destructive">
                  {errors.templateId}
                </p>
              ) : null}
              <p className="text-sm text-muted-foreground">
                You can change the template later from your dashboard.
              </p>
            </div>
          ) : null}

          {current.key === "details" ? (
            <div className="space-y-6">
              <Field id="title" label="Board title" error={errors.title}>
                {(aria) => (
                  <Input
                    {...aria}
                    maxLength={BOARD_LIMITS.title}
                    value={title}
                    onChange={(e) => {
                      setTitleEdited(true);
                      update({ title: e.target.value });
                    }}
                  />
                )}
              </Field>
              <Field
                id="intro"
                label="Intro message (optional)"
                description={`A note from you at the top of the board. ${state.intro.length}/${BOARD_LIMITS.intro}`}
                error={errors.intro}
              >
                {(aria) => (
                  <Textarea
                    {...aria}
                    rows={4}
                    maxLength={BOARD_LIMITS.intro}
                    placeholder="Everyone, let's make this the best birthday card ever!"
                    value={state.intro}
                    onChange={(e) => update({ intro: e.target.value })}
                  />
                )}
              </Field>
              <Field
                id="eventDate"
                label="Event date (optional)"
                description="Shown on the board so contributors know the deadline."
                error={errors.eventDate}
              >
                {(aria) => (
                  <Input
                    {...aria}
                    type="date"
                    className="w-auto"
                    value={state.eventDate}
                    onChange={(e) => update({ eventDate: e.target.value })}
                  />
                )}
              </Field>
              <VisibilityFields
                allowGuests={state.allowGuests}
                messagesVisible={state.messagesVisible}
                onChange={update}
              />
            </div>
          ) : null}

          {formError ? (
            <p
              role="alert"
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setErrors({});
                setStep((s) => Math.max(s - 1, 0));
              }}
              disabled={step === 0 || pending}
            >
              <ArrowLeft /> Back
            </Button>
            <Button type="submit" disabled={pending}>
              {isLast ? (
                pending ? (
                  <>
                    <Loader2 className="animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    <Check /> Create board
                  </>
                )
              ) : (
                <>
                  Next <ArrowRight />
                </>
              )}
            </Button>
          </div>
        </div>

        {showPreview ? (
          <aside
            aria-label="Live preview"
            className="lg:sticky lg:top-20 lg:self-start"
          >
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Live preview · {template.name}
            </p>
            <TemplatePreview
              template={template}
              title={title}
              intro={state.intro}
            />
          </aside>
        ) : null}
      </form>
    </div>
  );
}

function stepHeading(key: (typeof STEPS)[number]["key"], state: State): string {
  const name = state.recipientName.trim() || "them";
  switch (key) {
    case "recipient":
      return "Who is this board for?";
    case "occasion":
      return `What are we celebrating with ${name}?`;
    case "template":
      return state.occasion
        ? `Pick a ${OCCASIONS[state.occasion].label.toLowerCase()} look`
        : "Pick a look";
    case "details":
      return "Final touches";
  }
}
