"use client";

import { cn } from "@/lib/utils";
import { type Occasion, OCCASION_LIST, OCCASIONS } from "@/lib/occasions";

type Props = {
  value: Occasion | null;
  onChange: (occasion: Occasion) => void;
  /** Accessible name for the radio group. */
  legend: string;
  hideLegend?: boolean;
};

/** Occasion choice as a native radio group (arrow keys work out of the box). */
export function OccasionPicker({ value, onChange, legend, hideLegend }: Props) {
  return (
    <fieldset>
      <legend
        className={cn("mb-3 text-sm font-medium", hideLegend && "sr-only")}
      >
        {legend}
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {OCCASION_LIST.map((occasion) => {
          const info = OCCASIONS[occasion];
          return (
            <label
              key={occasion}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border bg-card p-4 text-center transition-colors hover:bg-accent has-checked:border-primary has-checked:bg-primary/5 has-checked:ring-2 has-checked:ring-primary/40 has-focus-visible:ring-2 has-focus-visible:ring-ring"
            >
              <input
                type="radio"
                name="occasion"
                value={occasion}
                checked={value === occasion}
                onChange={() => onChange(occasion)}
                className="sr-only"
              />
              <span className="text-3xl" aria-hidden="true">
                {info.emoji}
              </span>
              <span className="font-medium">{info.label}</span>
              <span className="text-xs text-muted-foreground">
                {info.blurb}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
