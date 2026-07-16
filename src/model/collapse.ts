import type { CesrMessage } from '../cesr/types';

/** A rendering item: a single event, or a collapsed run of consecutive same-owner ixn events. */
export type DisplayItem =
  | { kind: 'event'; message: CesrMessage; index: number }
  | { kind: 'run'; messages: CesrMessage[]; start: number };

/** Collapse each maximal run of `min` or more CONSECUTIVE same-owner ixn events into one run item, in
 * stream order — nothing is reordered, grouped across owners, or hidden (decision r6nk2w). Everything
 * else stays an individual event. */
export function collapseRuns(messages: CesrMessage[], min = 3): DisplayItem[] {
  const items: DisplayItem[] = [];
  let i = 0;
  while (i < messages.length) {
    const owner = messages[i].sad?.i;
    if (messages[i].ilk === 'ixn' && typeof owner === 'string') {
      let j = i + 1;
      while (j < messages.length && messages[j].ilk === 'ixn' && messages[j].sad?.i === owner) j++;
      if (j - i >= min) {
        items.push({ kind: 'run', messages: messages.slice(i, j), start: i });
        i = j;
        continue;
      }
    }
    items.push({ kind: 'event', message: messages[i], index: i });
    i++;
  }
  return items;
}
