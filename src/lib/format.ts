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
