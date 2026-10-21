// Event dates are stored as UTC midnight (see optionalDate), so always format
// them in UTC or they can shift a day for users west of Greenwich.
const eventDateFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function formatEventDate(date: Date): string {
  return eventDateFormat.format(date);
}

/** `YYYY-MM-DD` for <input type="date">. */
export function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "12 messages from 9 people · 3 Mar 2026", from each message's author name. */
export function boardSummary(
  authorNames: string[],
  eventDateLabel: string | null,
): string {
  const people = new Set(authorNames.map((n) => n.trim().toLowerCase())).size;
  const messages =
    authorNames.length > 0
      ? `${pluralize(authorNames.length, "message")} from ${pluralize(people, "person", "people")}`
      : "No messages yet";
  return eventDateLabel ? `${messages} · ${eventDateLabel}` : messages;
}
