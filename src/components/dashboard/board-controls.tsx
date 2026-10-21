"use client";

import { Lock, LockOpen, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteBoardAction, setBoardOpenAction } from "@/server/actions/boards";
import { ConfirmButton } from "./confirm-button";

type Props = { boardId: string; isOpen: boolean; title: string };

export function BoardControls({ boardId, isOpen, title }: Props) {
  const [pending, startTransition] = useTransition();

  function reopen() {
    startTransition(async () => {
      const result = await setBoardOpenAction(boardId, true);
      if (result.ok) toast.success("Board reopened for new messages");
      else toast.error(result.error);
    });
  }

  async function close() {
    const result = await setBoardOpenAction(boardId, false);
    if (result.ok) toast.success("Board closed to new messages");
    else toast.error(result.error);
  }

  async function remove() {
    // Redirects to the dashboard on success.
    const result = await deleteBoardAction(boardId);
    if (!result.ok) toast.error(result.error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-medium">
            {isOpen ? "Accepting messages" : "Closed to new messages"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isOpen
              ? "Close the board when you're ready to send it. Existing messages stay."
              : "Contributors can still view the board, but can't post."}
          </p>
        </div>
        {isOpen ? (
          <ConfirmButton
            title="Close the board?"
            description="Nobody will be able to add new messages until you reopen it."
            confirmLabel="Close board"
            onConfirm={close}
          >
            <Lock /> Close board
          </ConfirmButton>
        ) : (
          <Button variant="outline" onClick={reopen} disabled={pending}>
            <LockOpen /> Reopen
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-destructive/30 p-4">
        <div>
          <h3 className="font-medium text-destructive">Delete board</h3>
          <p className="text-sm text-muted-foreground">
            Permanently deletes the board and every message on it.
          </p>
        </div>
        <ConfirmButton
          variant="destructive"
          destructive
          title={`Delete “${title}”?`}
          description="This permanently deletes the board and all of its messages. It can't be undone."
          confirmLabel="Delete forever"
          onConfirm={remove}
        >
          <Trash2 /> Delete
        </ConfirmButton>
      </div>
    </div>
  );
}
