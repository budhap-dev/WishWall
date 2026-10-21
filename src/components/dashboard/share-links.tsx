"use client";

import { Copy, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { regenerateLinkAction } from "@/server/actions/boards";
import { ConfirmButton } from "./confirm-button";

type Props = {
  boardId: string;
  contributeUrl: string;
  revealUrl: string;
};

export function ShareLinks({ boardId, contributeUrl, revealUrl }: Props) {
  return (
    <div className="space-y-6">
      <LinkRow
        boardId={boardId}
        kind="share"
        label="Contribute link"
        description="Share this with friends and family so they can add messages."
        url={contributeUrl}
      />
      <LinkRow
        boardId={boardId}
        kind="reveal"
        label="Recipient link"
        description="Send this to the recipient when it's time. It shows the finished board, with no “Add a message” button."
        url={revealUrl}
      />
    </div>
  );
}

function LinkRow(props: {
  boardId: string;
  kind: "share" | "reveal";
  label: string;
  description: string;
  url: string;
}) {
  const inputId = `link-${props.kind}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(props.url);
      toast.success(`${props.label} copied`);
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  }

  async function regenerate() {
    const result = await regenerateLinkAction(props.boardId, props.kind);
    if (result.ok) toast.success(`New ${props.label.toLowerCase()} created`);
    else toast.error(result.error);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{props.label}</Label>
      <p
        id={`${inputId}-description`}
        className="text-sm text-muted-foreground"
      >
        {props.description}
      </p>
      <div className="flex flex-wrap gap-2">
        <Input
          id={inputId}
          readOnly
          value={props.url}
          aria-describedby={`${inputId}-description`}
          className="min-w-0 flex-1 basis-64 font-mono text-xs"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button type="button" onClick={copy}>
          <Copy /> Copy
        </Button>
        <Button asChild variant="outline">
          <a href={props.url} target="_blank" rel="noreferrer">
            <ExternalLink /> Open
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </Button>
        <ConfirmButton
          variant="ghost"
          title={`Replace the ${props.label.toLowerCase()}?`}
          description="The current link will stop working immediately. Anyone who has it will need the new one."
          confirmLabel="Replace link"
          onConfirm={regenerate}
        >
          <RefreshCw /> New link
        </ConfirmButton>
      </div>
    </div>
  );
}
