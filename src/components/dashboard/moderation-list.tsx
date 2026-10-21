"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { StoredImage } from "@/components/messages/stored-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toPlainText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";
import {
  deleteMessageAsOwnerAction,
  setMessageHiddenAction,
} from "@/server/actions/messages";
import type { MessageView } from "@/server/services/messages";
import { ConfirmButton } from "./confirm-button";

type ModeratedMessage = MessageView & { hidden: boolean };

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Owner's view of every message on a board, including hidden ones. */
export function ModerationList({ messages }: { messages: ModeratedMessage[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No messages yet. Share the contribute link to get started.
      </p>
    );
  }
  return (
    <ul className="divide-y">
      {messages.map((message) => (
        <ModerationRow key={message.id} message={message} />
      ))}
    </ul>
  );
}

function ModerationRow({ message }: { message: ModeratedMessage }) {
  const [pending, startTransition] = useTransition();

  function toggleHidden() {
    startTransition(async () => {
      const result = await setMessageHiddenAction(message.id, !message.hidden);
      if (result.ok)
        toast.success(
          message.hidden ? "Message is visible again" : "Message hidden",
        );
      else toast.error(result.error);
    });
  }

  async function remove() {
    const result = await deleteMessageAsOwnerAction(message.id);
    if (result.ok) toast.success("Message deleted");
    else toast.error(result.error);
  }

  return (
    <li className={cn("flex gap-3 py-4", message.hidden && "opacity-60")}>
      {message.image ? (
        <div className="size-14 shrink-0 overflow-hidden rounded-md border bg-muted">
          <StoredImage
            src={message.image.url}
            alt={message.image.alt}
            width={message.image.width}
            height={message.image.height}
            sizes="56px"
            className="size-full object-cover"
          />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{message.authorName}</p>
          {message.hidden ? <Badge variant="outline">Hidden</Badge> : null}
          <time
            className="text-xs text-muted-foreground"
            dateTime={message.createdAt}
          >
            {dateFormat.format(new Date(message.createdAt))}
          </time>
        </div>
        {message.body ? (
          <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line text-muted-foreground">
            {toPlainText(message.body)}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-start gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleHidden}
          disabled={pending}
        >
          {message.hidden ? <Eye /> : <EyeOff />}
          {message.hidden ? "Unhide" : "Hide"}
        </Button>
        <ConfirmButton
          variant="ghost"
          size="sm"
          destructive
          title="Delete this message?"
          description={`This permanently deletes ${message.authorName}'s message. It can't be undone.`}
          confirmLabel="Delete"
          onConfirm={remove}
        >
          <Trash2 /> Delete
        </ConfirmButton>
      </div>
    </li>
  );
}
