"use client";

import { Lock, PenLine, Pencil, Settings2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/dashboard/confirm-button";
import { Button } from "@/components/ui/button";
import {
  forgetEditToken,
  loadGuestName,
  tokensForBoard,
  useEditTokens,
} from "@/lib/client/edit-tokens";
import {
  deleteMessageAction,
  getMyMessagesAction,
} from "@/server/actions/messages";
import type { MessageView } from "@/server/services/messages";
import { resolveTemplate } from "@/templates";
import { boardSurfaceStyle, headingStyle } from "@/templates/styles";
import type { Occasion } from "@/lib/occasions";
import { ComposeDialog, type ComposeTarget } from "./compose-dialog";
import { MessageCard } from "./message-card";
import { StoredImage } from "./stored-image";

export type ContributeBoardProps = {
  board: {
    id: string;
    shareSlug: string;
    title: string;
    intro: string | null;
    recipientName: string;
    recipientPhotoUrl: string | null;
    eventDateLabel: string | null;
    occasion: Occasion;
    templateId: string;
    isOpen: boolean;
    allowGuests: boolean;
    messagesVisible: boolean;
  };
  messages: MessageView[];
  viewer: { signedIn: boolean; name: string | null; isOwner: boolean };
  captchaSiteKey: string | null;
  uploadsEnabled: boolean;
  signInHref: string;
};

export function ContributeBoard({
  board,
  messages,
  viewer,
  captchaSiteKey,
  uploadsEnabled,
  signInHref,
}: ContributeBoardProps) {
  const template = resolveTemplate(board.templateId, board.occasion);
  const tokens = useEditTokens();
  const [composeOpen, setComposeOpen] = useState(false);
  const [target, setTarget] = useState<ComposeTarget>({ mode: "create" });
  // Surprise mode: the server doesn't know which messages are a guest's, so
  // fetch them using the tokens stored in this browser.
  const [ownExtra, setOwnExtra] = useState<MessageView[]>([]);
  const surprise = !board.messagesVisible && !viewer.isOwner;
  const boardTokens = useMemo(
    () => tokensForBoard(tokens, board.id),
    [tokens, board.id],
  );

  useEffect(() => {
    if (!surprise || boardTokens.length === 0) return;
    let cancelled = false;
    void getMyMessagesAction(board.shareSlug, boardTokens).then((own) => {
      if (!cancelled) setOwnExtra(own);
    });
    return () => {
      cancelled = true;
    };
  }, [surprise, boardTokens, board.shareSlug]);

  const shown = useMemo(() => {
    const byId = new Map<string, MessageView>();
    for (const m of [...messages, ...ownExtra]) byId.set(m.id, m);
    return [...byId.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }, [messages, ownExtra]);

  const isMine = (m: MessageView) => m.isMine || Boolean(tokens[m.id]);
  const canPost = board.isOpen && (viewer.signedIn || board.allowGuests);
  const needsSignIn = board.isOpen && !viewer.signedIn && !board.allowGuests;

  function openCreate() {
    setTarget({ mode: "create" });
    setComposeOpen(true);
  }

  function onSaved(message: MessageView) {
    if (surprise)
      setOwnExtra((prev) => [
        ...prev.filter((m) => m.id !== message.id),
        message,
      ]);
  }

  async function remove(message: MessageView) {
    const result = await deleteMessageAction(
      board.shareSlug,
      message.id,
      tokens[message.id]?.token ?? null,
    );
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    forgetEditToken(message.id);
    setOwnExtra((prev) => prev.filter((m) => m.id !== message.id));
    toast.success("Message deleted");
  }

  const accentButton = {
    backgroundColor: template.colors.accent,
    color: template.colors.accentText,
  };

  return (
    <div className="min-h-dvh pb-28" style={boardSurfaceStyle(template)}>
      <header className="mx-auto max-w-3xl px-4 pt-12 pb-8 text-center sm:pt-16">
        {board.recipientPhotoUrl ? (
          <div className="mx-auto mb-5 size-28 overflow-hidden rounded-full border-4 border-white/80 shadow-lg">
            <StoredImage
              src={board.recipientPhotoUrl}
              alt={board.recipientName}
              width={224}
              height={224}
              sizes="112px"
              priority
              className="size-full object-cover"
            />
          </div>
        ) : null}
        <h1
          className="text-4xl leading-tight text-balance sm:text-5xl"
          style={headingStyle(template)}
        >
          {board.title}
        </h1>
        {board.intro ? (
          <p className="mx-auto mt-4 max-w-xl text-lg whitespace-pre-line">
            {board.intro}
          </p>
        ) : null}
        <p className="mt-3 text-sm opacity-80">
          For {board.recipientName}
          {board.eventDateLabel ? ` · ${board.eventDateLabel}` : ""}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {canPost ? (
            <Button
              size="lg"
              onClick={openCreate}
              style={accentButton}
              className="hover:opacity-90"
            >
              <PenLine /> Add a message
            </Button>
          ) : null}
          {needsSignIn ? (
            <Button
              asChild
              size="lg"
              style={accentButton}
              className="hover:opacity-90"
            >
              <Link href={signInHref}>Sign in to add a message</Link>
            </Button>
          ) : null}
          {viewer.isOwner ? (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white/80 text-neutral-900 hover:bg-white"
            >
              <Link href={`/dashboard/boards/${board.id}`}>
                <Settings2 /> Manage
              </Link>
            </Button>
          ) : null}
        </div>

        {!board.isOpen ? (
          <p className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-sm">
            <Lock className="size-4" aria-hidden="true" /> This board is closed
            to new messages.
          </p>
        ) : null}
        {surprise ? (
          <p className="mx-auto mt-5 max-w-md rounded-lg bg-black/10 px-3 py-2 text-sm">
            🤫 It&apos;s a surprise! You&apos;ll only see your own messages here
            until the board is revealed.
          </p>
        ) : null}
        {canPost && !viewer.signedIn ? (
          <p className="mt-4 text-xs opacity-75">
            Posting as a guest.{" "}
            <Link href={signInHref} className="underline underline-offset-2">
              Sign in with Google
            </Link>{" "}
            to edit your message from any device.
          </p>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <h2 className="sr-only">Messages</h2>
        {shown.length === 0 ? (
          <p className="py-16 text-center text-lg opacity-80">
            {canPost ? "No messages yet. Be the first! ✨" : "No messages yet."}
          </p>
        ) : (
          <ul className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
            {shown.map((message) => (
              <li key={message.id} className="mb-5 break-inside-avoid">
                <MessageCard
                  message={message}
                  template={template}
                  actions={
                    isMine(message) ? (
                      <div className="flex shrink-0 gap-1">
                        {board.isOpen ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="hover:bg-black/10"
                            aria-label="Edit your message"
                            onClick={() => {
                              setTarget({
                                mode: "edit",
                                message,
                                editToken: tokens[message.id]?.token ?? null,
                              });
                              setComposeOpen(true);
                            }}
                          >
                            <Pencil />
                          </Button>
                        ) : null}
                        <ConfirmButton
                          variant="ghost"
                          size="icon-sm"
                          className="hover:bg-black/10"
                          destructive
                          title="Delete your message?"
                          description="This removes it from the board for everyone. It can't be undone."
                          confirmLabel="Delete"
                          onConfirm={() => remove(message)}
                        >
                          <Trash2 />
                          <span className="sr-only">Delete your message</span>
                        </ConfirmButton>
                      </div>
                    ) : null
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {canPost ? (
        // Always-reachable button on small screens.
        <div className="fixed inset-x-0 bottom-4 flex justify-center sm:hidden">
          <Button
            size="lg"
            onClick={openCreate}
            style={accentButton}
            className="shadow-lg"
          >
            <PenLine /> Add a message
          </Button>
        </div>
      ) : null}

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        target={target}
        board={{ id: board.id, shareSlug: board.shareSlug }}
        template={template}
        defaultName={
          viewer.name ?? (typeof window === "undefined" ? "" : loadGuestName())
        }
        captchaSiteKey={viewer.signedIn ? null : captchaSiteKey}
        uploadsEnabled={uploadsEnabled}
        onSaved={onSaved}
      />
    </div>
  );
}
