"use client";

import { TemplatePreview } from "@/components/templates/template-preview";
import { cn } from "@/lib/utils";
import type { Occasion } from "@/lib/occasions";
import { templatesFor } from "@/templates";

type Props = {
  occasion: Occasion;
  value: string;
  onChange: (templateId: string) => void;
  legend: string;
  hideLegend?: boolean;
  /** Title rendered inside the thumbnails. */
  previewTitle: string;
};

export function TemplatePicker({
  occasion,
  value,
  onChange,
  legend,
  hideLegend,
  previewTitle,
}: Props) {
  const options = templatesFor(occasion);
  return (
    <fieldset>
      <legend
        className={cn("mb-3 text-sm font-medium", hideLegend && "sr-only")}
      >
        {legend}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((template) => (
          <label
            key={template.id}
            className="group flex cursor-pointer flex-col gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent has-checked:border-primary has-checked:ring-2 has-checked:ring-primary/40 has-focus-visible:ring-2 has-focus-visible:ring-ring"
          >
            <input
              type="radio"
              name="template"
              value={template.id}
              checked={value === template.id}
              onChange={() => onChange(template.id)}
              className="sr-only"
            />
            <TemplatePreview
              template={template}
              title={previewTitle}
              size="compact"
            />
            <span>
              <span className="block font-medium">{template.name}</span>
              <span className="block text-sm text-muted-foreground">
                {template.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
