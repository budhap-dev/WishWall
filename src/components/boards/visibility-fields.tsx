"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = {
  allowGuests: boolean;
  messagesVisible: boolean;
  onChange: (patch: {
    allowGuests?: boolean;
    messagesVisible?: boolean;
  }) => void;
};

export function VisibilityFields({
  allowGuests,
  messagesVisible,
  onChange,
}: Props) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium">
        Who can post and what they see
      </legend>
      <SwitchRow
        id="allowGuests"
        label="Allow guests"
        description="Anyone with the link can post by typing their name. Turn off to require Google sign-in."
        checked={allowGuests}
        onCheckedChange={(v) => onChange({ allowGuests: v })}
      />
      <SwitchRow
        id="messagesVisible"
        label="Contributors can see each other's messages"
        description="Turn off for surprise mode: contributors only see their own message. You and the recipient always see everything."
        checked={messagesVisible}
        onCheckedChange={(v) => onChange({ messagesVisible: v })}
      />
    </fieldset>
  );
}

function SwitchRow(props: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="space-y-1">
        <Label htmlFor={props.id}>{props.label}</Label>
        <p
          id={`${props.id}-description`}
          className="text-sm text-muted-foreground"
        >
          {props.description}
        </p>
      </div>
      <Switch
        id={props.id}
        checked={props.checked}
        onCheckedChange={props.onCheckedChange}
        aria-describedby={`${props.id}-description`}
      />
    </div>
  );
}
