import type { CesrMessage } from '../cesr/types';
import type { EventLog } from './stream';

/** A best-effort, honest characterization of a pasted stream: an inferred KIND and a COMPOSITION
 * breakdown. The kind is an inference from the message mix (shown as such in the UI), never a claim. */
export interface StreamDescription {
  kind: string;
  composition: string;
}

const KEL_ILKS = new Set(['icp', 'rot', 'ixn', 'dip', 'drt']);

/** Infer what a stream is from its contents: reply (`rpy`) messages mark an OOBI / endpoint-reply
 * stream, a TEL log marks a transaction event log, an all-key-event stream is a KEL, and anything else
 * is mixed. The composition lists the owning-identifier count and the per-ilk tallies (commonest
 * first). Returns null for an empty stream. */
export function describeStream(messages: CesrMessage[], logs: EventLog[]): StreamDescription | null {
  if (messages.length === 0) return null;

  const ilkCounts: Record<string, number> = {};
  for (const m of messages) {
    const t = m.ilk ?? m.kind;
    ilkCounts[t] = (ilkCounts[t] ?? 0) + 1;
  }

  const hasRpy = (ilkCounts.rpy ?? 0) > 0;
  const hasTel = logs.some((l) => l.kind === 'TEL');
  const onlyKel = messages.every((m) => m.ilk !== null && KEL_ILKS.has(m.ilk));
  let kind: string;
  if (hasRpy) kind = 'OOBI / endpoint reply stream';
  else if (hasTel) kind = 'TEL (transaction event log)';
  else if (onlyKel) kind = 'KEL (key event log)';
  else kind = 'mixed stream';

  const ids = logs.length;
  const ilkStr = Object.entries(ilkCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${v} ${k}`)
    .join(', ');
  const composition = `${ids} identifier${ids === 1 ? '' : 's'} · ${ilkStr}`;
  return { kind, composition };
}
