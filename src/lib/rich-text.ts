/**
 * The tiny formatting language for messages: **bold** and _italic_, plus
 * line breaks. Text is parsed into segments that components render as React
 * elements, so user input is never treated as HTML.
 */

export type Segment = { text: string; bold?: boolean; italic?: boolean };
export type Line = Segment[];

// **bold** (no newlines inside), _italic_ (word-bounded so snake_case_words stay literal).
const TOKEN =
  /\*\*([^*\n]+?)\*\*|(?<![\p{L}\p{N}_])_([^_\n]+?)_(?![\p{L}\p{N}_])/gu;

function parseLine(line: string): Line {
  const segments: Line = [];
  let last = 0;
  for (const match of line.matchAll(TOKEN)) {
    if (match.index > last)
      segments.push({ text: line.slice(last, match.index) });
    if (match[1] !== undefined) segments.push({ text: match[1], bold: true });
    else segments.push({ text: match[2]!, italic: true });
    last = match.index + match[0].length;
  }
  if (last < line.length) segments.push({ text: line.slice(last) });
  return segments;
}

export function parseRichText(text: string): Line[] {
  return text.split("\n").map(parseLine);
}

/** Plain-text version (markers removed), for previews and alt text. */
export function toPlainText(text: string): string {
  return parseRichText(text)
    .map((line) => line.map((s) => s.text).join(""))
    .join("\n");
}
