"use client";

import { Bold, Italic, Loader2 } from "lucide-react";
import { useCallback, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveEditToken, saveGuestName } from "@/lib/client/edit-tokens";
import {
  isFontId,
  isTextColorId,
  isTextColorReadable,
  MESSAGE_FONT_IDS,
  MESSAGE_FONTS,
  type MessageFontId,
  TEXT_COLOR_IDS,
  TEXT_COLORS,
  type TextColorId,
} from "@/lib/message-style";
import { cn } from "@/lib/utils";
import { MESSAGE_LIMITS } from "@/lib/validation/message";
import {
  createMessageAction,
  updateMessageAction,
} from "@/server/actions/messages";
import type { MessageView } from "@/server/services/messages";
import {
  CARD_COLOR_KEYS,
  type CardColorKey,
  type TemplateConfig,
} from "@/templates";
import { fontFamily } from "@/templates/fonts";
import { cardColorKey } from "@/templates/styles";
import { type ImageValue, ImageUploadField } from "./image-upload-field";
import { MessageCard } from "./message-card";
import { Turnstile } from "./turnstile";

const QUICK_EMOJI = [
  "🎉",
  "❤️",
  "🥳",
  "😂",
  "🙏",
  "👏",
  "🎂",
  "🌟",
  "🤗",
  "💐",
];

export type ComposeTarget =
  | { mode: "create" }
  | { mode: "edit"; message: MessageView; editToken: string | null };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ComposeTarget;
  board: { id: string; shareSlug: string };
  template: TemplateConfig;
  defaultName: string;
  /** Turnstile site key when guests must pass a CAPTCHA; null otherwise. */
  captchaSiteKey: string | null;
  /** Show the photo/GIF field (UPLOADS_ENABLED). */
  uploadsEnabled: boolean;
  /** Called with the saved message (create or edit). */
  onSaved: (message: MessageView) => void;
};

type FieldErrors = Record<string, string | undefined>;

export function ComposeDialog(props: Props) {
  // Remount the form whenever the dialog opens for a different target, so
  // fields start from that message's values.
  const key =
    props.target.mode === "edit" ? `edit-${props.target.message.id}` : "create";
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {props.open ? <ComposeForm key={key} {...props} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function ComposeForm({
  target,
  board,
  template,
  defaultName,
  captchaSiteKey,
  uploadsEnabled,
  onSaved,
  onOpenChange,
}: Props) {
  const editing = target.mode === "edit" ? target.message : null;
  const ids = { body: useId(), name: useId() };
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [body, setBody] = useState(editing?.body ?? "");
  const [authorName, setAuthorName] = useState(
    editing?.authorName ?? defaultName,
  );
  const [cardColor, setCardColor] = useState<CardColorKey>(
    cardColorKey(template, editing?.cardColor),
  );
  const [font, setFont] = useState<MessageFontId | null>(
    isFontId(editing?.font) ? editing.font : null,
  );
  const [textColor, setTextColor] = useState<TextColorId | null>(
    isTextColorId(editing?.textColor) ? editing.textColor : null,
  );
  // A colour that isn't readable on the current card colour counts as "default".
  const effectiveTextColor =
    textColor && isTextColorReadable(template, cardColor, textColor)
      ? textColor
      : null;
  const [image, setImage] = useState<ImageValue | null>(
    editing?.image ? { ...editing.image, token: "" } : null,
  );
  const [uploading, setUploading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const onCaptchaToken = useCallback(
    (t: string | null) => setCaptchaToken(t),
    [],
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /** Wraps the textarea selection in a marker (** or _), or inserts a pair. */
  function format(marker: string) {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = body.slice(start, end);
    const next =
      body.slice(0, start) + marker + selected + marker + body.slice(end);
    if (next.length > MESSAGE_LIMITS.body) return;
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + marker.length, end + marker.length);
    });
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    const at = el?.selectionStart ?? body.length;
    const next = body.slice(0, at) + emoji + body.slice(el?.selectionEnd ?? at);
    if (next.length > MESSAGE_LIMITS.body) return;
    setBody(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(at + emoji.length, at + emoji.length);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (captchaSiteKey && !editing && !captchaToken) {
      setFormError("Please complete the “I'm human” check.");
      return;
    }
    const content = {
      authorName,
      body,
      cardColor,
      font,
      textColor: effectiveTextColor,
      image: image
        ? {
            key: image.key,
            width: image.width,
            height: image.height,
            token: image.token,
            alt: image.alt,
          }
        : null,
    };

    startTransition(async () => {
      const result = editing
        ? await updateMessageAction(
            board.shareSlug,
            editing.id,
            target.mode === "edit" ? target.editToken : null,
            content,
          )
        : await createMessageAction(board.shareSlug, {
            ...content,
            captchaToken: captchaToken ?? undefined,
          });

      if (!result.ok) {
        setFormError(result.error);
        setErrors(
          Object.fromEntries(
            Object.entries(result.fieldErrors ?? {}).map(([k, v]) => [
              k,
              v?.[0],
            ]),
          ),
        );
        return;
      }
      const editToken =
        "editToken" in result.data
          ? (result.data.editToken as string | null)
          : null;
      if (editToken) saveEditToken(result.data.message.id, board.id, editToken);
      if (!editing) saveGuestName(authorName);
      toast.success(
        editing ? "Message updated" : "Your message has been added 🎉",
      );
      onSaved(result.data.message);
      onOpenChange(false);
    });
  }

  const preview = {
    authorName: authorName.trim() || "Your name",
    body: body.trim() || (image ? "" : "Your message will appear here…"),
    image: image
      ? {
          key: image.key,
          url: image.url,
          width: image.width,
          height: image.height,
          alt: image.alt,
        }
      : null,
    cardColor,
    font,
    textColor: effectiveTextColor,
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <DialogHeader>
        <DialogTitle>
          {editing ? "Edit your message" : "Add your message"}
        </DialogTitle>
        <DialogDescription>
          Use **bold** or _italic_, add emoji
          {uploadsEnabled ? ", a photo or a GIF" : ""}, and pick a card colour.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <Label htmlFor={ids.body}>Message</Label>
              <div
                className="flex gap-1"
                role="toolbar"
                aria-label="Formatting"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => format("**")}
                  aria-label="Bold"
                >
                  <Bold />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => format("_")}
                  aria-label="Italic"
                >
                  <Italic />
                </Button>
              </div>
            </div>
            <Textarea
              id={ids.body}
              ref={textareaRef}
              rows={5}
              maxLength={MESSAGE_LIMITS.body}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-invalid={errors.body ? true : undefined}
              aria-describedby={`${ids.body}-count`}
              placeholder="Write something lovely…"
              autoFocus
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-0.5" aria-label="Insert emoji">
                {QUICK_EMOJI.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="rounded-md px-1.5 py-1 text-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label={`Insert ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <span
                id={`${ids.body}-count`}
                className="text-xs text-muted-foreground"
              >
                {body.length}/{MESSAGE_LIMITS.body}
              </span>
            </div>
            {errors.body ? (
              <p className="text-sm font-medium text-destructive">
                {errors.body}
              </p>
            ) : null}
          </div>

          {uploadsEnabled ? (
            <ImageUploadField
              label="Photo or GIF (optional)"
              purpose="messages"
              boardShareSlug={board.shareSlug}
              value={image}
              onChange={setImage}
              onBusyChange={setUploading}
              withAlt
            />
          ) : null}

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Card colour</legend>
            <div className="flex flex-wrap gap-2">
              {CARD_COLOR_KEYS.map((key) => {
                const color = template.cards.palette[key];
                return (
                  <label
                    key={key}
                    title={color.label}
                    className="relative flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-transparent ring-offset-2 has-checked:border-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring"
                    style={{ backgroundColor: color.background }}
                  >
                    <input
                      type="radio"
                      name="cardColor"
                      value={key}
                      checked={cardColor === key}
                      onChange={() => setCardColor(key)}
                      className="sr-only"
                    />
                    <span className="sr-only">{color.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Font</legend>
            <div className="flex flex-wrap gap-2">
              {([null, ...MESSAGE_FONT_IDS] as const).map((id) => (
                <label
                  key={id ?? "default"}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm has-checked:border-foreground has-checked:bg-muted has-focus-visible:ring-2 has-focus-visible:ring-ring"
                >
                  <input
                    type="radio"
                    name="font"
                    checked={font === id}
                    onChange={() => setFont(id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="text-base leading-none"
                    style={{
                      fontFamily: fontFamily(
                        id ? MESSAGE_FONTS[id].font : template.fonts.body,
                      ),
                      fontSize: id ? `${MESSAGE_FONTS[id].scale}em` : undefined,
                    }}
                  >
                    Aa
                  </span>
                  {id ? MESSAGE_FONTS[id].label : "Default"}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Text colour</legend>
            <div className="flex flex-wrap gap-2">
              {([null, ...TEXT_COLOR_IDS] as const).map((id) => {
                const readable =
                  id === null || isTextColorReadable(template, cardColor, id);
                const hex = id
                  ? TEXT_COLORS[id].hex
                  : template.cards.palette[cardColor].text;
                const label = id ? TEXT_COLORS[id].label : "Default";
                return (
                  <label
                    key={id ?? "default"}
                    title={
                      readable
                        ? label
                        : `${label} isn't readable on this card colour`
                    }
                    className={cn(
                      "flex size-9 items-center justify-center rounded-full border-2 border-transparent ring-offset-2 has-checked:border-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring",
                      readable
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-35",
                    )}
                    style={{
                      backgroundColor:
                        template.cards.palette[cardColor].background,
                    }}
                  >
                    <input
                      type="radio"
                      name="textColor"
                      checked={effectiveTextColor === id}
                      disabled={!readable}
                      onChange={() => setTextColor(id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="text-lg font-bold"
                      style={{ color: hex }}
                    >
                      A
                    </span>
                    <span className="sr-only">
                      {label}
                      {readable ? "" : " (not readable on this card colour)"}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor={ids.name}>Your name</Label>
            <Input
              id={ids.name}
              maxLength={MESSAGE_LIMITS.authorName}
              autoComplete="name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              aria-invalid={errors.authorName ? true : undefined}
              placeholder="How should we sign it?"
            />
            {errors.authorName ? (
              <p className="text-sm font-medium text-destructive">
                {errors.authorName}
              </p>
            ) : null}
          </div>

          {captchaSiteKey && !editing ? (
            <Turnstile siteKey={captchaSiteKey} onToken={onCaptchaToken} />
          ) : null}
        </div>

        <div aria-hidden="true" className="hidden sm:block">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Preview
          </p>
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: template.colors.background }}
          >
            <MessageCard
              message={preview}
              template={template}
              className={cn(!body.trim() && !image && "opacity-70")}
            />
          </div>
        </div>
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </p>
      ) : null}

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending || uploading}>
          {pending ? <Loader2 className="animate-spin" /> : null}
          {editing ? "Save changes" : "Post message"}
        </Button>
      </DialogFooter>
    </form>
  );
}
