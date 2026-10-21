import { Fragment } from "react";
import { parseRichText } from "@/lib/rich-text";

/** Renders message text with **bold**, _italic_ and line breaks. Never uses innerHTML. */
export function RichText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = parseRichText(text);
  return (
    <p className={className}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {line.map((segment, j) =>
            segment.bold ? (
              <strong key={j}>{segment.text}</strong>
            ) : segment.italic ? (
              <em key={j}>{segment.text}</em>
            ) : (
              <Fragment key={j}>{segment.text}</Fragment>
            ),
          )}
        </Fragment>
      ))}
    </p>
  );
}
