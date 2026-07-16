import { describe, it, expect } from 'vitest';
import { collapseRuns, type DisplayItem } from '../collapse';
import type { CesrMessage } from '../../cesr/types';

const A = 'AID_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const B = 'AID_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const m = (ilk: string | null, owner: string | null, sn: string): CesrMessage => ({
  proto: 'KERI', version: '1.0', kind: 'JSON', ilk, sn, said: 'd', sad: owner ? { i: owner } : null, span: { start: 0, end: 0 }, attachments: [],
});
const asRun = (item: DisplayItem) => item as Extract<DisplayItem, { kind: 'run' }>;

describe('collapseRuns', () => {
  it('collapses 3+ consecutive same-owner ixn into one run item', () => {
    const items = collapseRuns([m('icp', A, '0'), m('ixn', A, '1'), m('ixn', A, '2'), m('ixn', A, '3')]);
    expect(items.map((x) => x.kind)).toEqual(['event', 'run']);
    expect(asRun(items[1]).messages).toHaveLength(3);
    expect(asRun(items[1]).start).toBe(1);
  });

  it('does not collapse a run shorter than the minimum', () => {
    expect(collapseRuns([m('ixn', A, '0'), m('ixn', A, '1')]).map((x) => x.kind)).toEqual(['event', 'event']);
  });

  it('breaks a run where the owner changes', () => {
    const items = collapseRuns([m('ixn', A, '0'), m('ixn', A, '1'), m('ixn', A, '2'), m('ixn', B, '0'), m('ixn', B, '1'), m('ixn', B, '2')]);
    expect(items.map((x) => x.kind)).toEqual(['run', 'run']); // two separate per-owner runs, in order
  });

  it('does not collapse ixn that lack a string owner', () => {
    expect(collapseRuns([m('ixn', null, '0'), m('ixn', null, '1'), m('ixn', null, '2')]).every((x) => x.kind === 'event')).toBe(true);
  });

  it('leaves non-ixn events individual', () => {
    expect(collapseRuns([m('rot', A, '1'), m('icp', B, '0')]).map((x) => x.kind)).toEqual(['event', 'event']);
  });
});
