/** Prettify a KERI/ISO-8601 datetime into a human, UTC-anchored form — e.g.
 * `2026-07-25T19:03:27.123948+0000` → `Fri, 25 July 19:03 UTC`. Returns null if the value does not
 * parse as a date (the caller then shows the raw value alone). KERI stamps carry microseconds and may
 * use a colon-less offset (`+0000`), so both are normalized before parsing. */
export function prettyDatetime(value: string): string | null {
  const norm = value
    .replace(/(\.\d{3})\d+/, '$1') // microseconds → milliseconds
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2'); // +0000 → +00:00
  const t = Date.parse(norm);
  if (Number.isNaN(t)) return null;
  const parts = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).formatToParts(new Date(t));
  // Every requested part (weekday/day/month/hour/minute) is always emitted for a valid date.
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  return `${get('weekday')}, ${get('day')} ${get('month')} ${get('hour')}:${get('minute')} UTC`;
}

/** Renders a datetime field: the raw ISO stamp as-is, then a prettified, UTC-anchored reading in
 * parens. Falls back to the raw text alone for anything that does not parse as a date. */
export function DatetimeValue({ value }: { value: string }) {
  const pretty = prettyDatetime(value);
  if (pretty === null) return <>{value}</>;
  return (
    <span className="cesr-dt">
      <span className="dt-raw">{value}</span>
      <span className="dt-pretty"> ({pretty})</span>
    </span>
  );
}
