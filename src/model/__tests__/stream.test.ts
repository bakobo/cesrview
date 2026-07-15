import { existsSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { organize } from '../stream';
import { walk } from '../../cesr/walk';
import type { CesrMessage, WalkResult } from '../../cesr/types';

/** Build a minimal message; organize() reads only ilk/sn/said and sad.i / sad.di. */
function msg(f: { i?: string; s?: string; t?: string; d?: string; di?: string }): CesrMessage {
  const sad: Record<string, unknown> = {};
  if (f.i !== undefined) sad.i = f.i;
  if (f.s !== undefined) sad.s = f.s;
  if (f.t !== undefined) sad.t = f.t;
  if (f.di !== undefined) sad.di = f.di;
  if (f.d !== undefined) sad.d = f.d;
  return {
    proto: 'KERI',
    version: '1.0',
    kind: 'JSON',
    ilk: f.t ?? null,
    sn: f.s ?? null,
    said: f.d ?? null,
    sad,
    span: { start: 0, end: 0 },
    attachments: [],
  };
}
const result = (messages: CesrMessage[]): WalkResult => ({ messages, errors: [], consumed: 0 });

describe('organize — KEL/TEL log model (decision w3rn6k)', () => {
  it('groups interleaved KEL events into per-AID logs in arrival order', () => {
    const { logs, loose } = organize(
      result([
        msg({ i: 'A', s: '0', t: 'icp', d: 'da0' }),
        msg({ i: 'B', s: '0', t: 'icp', d: 'db0' }),
        msg({ i: 'A', s: '1', t: 'ixn', d: 'da1' }),
        msg({ i: 'B', s: '1', t: 'ixn', d: 'db1' }),
      ]),
    );
    expect(loose).toEqual([]);
    expect(logs.map((l) => l.aid)).toEqual(['A', 'B']); // ordered by first appearance
    expect(logs[0]).toMatchObject({ aid: 'A', kind: 'KEL', delegator: null, gaps: [], duplicities: [] });
    expect(logs[0].events.map((e) => e.sn)).toEqual([0, 1]);
    expect(logs[0].events.map((e) => e.streamIndex)).toEqual([0, 2]); // stream order preserved
  });

  it('orders lane events by numeric sn, not lexically (9, a, 10)', () => {
    const { logs } = organize(
      result([
        msg({ i: 'A', s: '10', t: 'ixn' }),
        msg({ i: 'A', s: '9', t: 'ixn' }),
        msg({ i: 'A', s: 'a', t: 'ixn' }),
        msg({ i: 'A', s: '0', t: 'icp' }),
      ]),
    );
    expect(logs[0].events.map((e) => e.sn)).toEqual([0, 9, 10, 16]);
  });

  it('reports missing sequence numbers as gaps', () => {
    const { logs } = organize(
      result([
        msg({ i: 'A', s: '0', t: 'icp' }),
        msg({ i: 'A', s: '1', t: 'ixn' }),
        msg({ i: 'A', s: '3', t: 'ixn' }),
      ]),
    );
    expect(logs[0].gaps).toEqual([2]);
  });

  it('flags duplicity when two events share a sequence number', () => {
    const { logs } = organize(
      result([
        msg({ i: 'A', s: '0', t: 'icp', d: 'x' }),
        msg({ i: 'A', s: '1', t: 'ixn', d: 'y' }),
        msg({ i: 'A', s: '1', t: 'ixn', d: 'z' }), // fork at sn 1
      ]),
    );
    expect(logs[0].duplicities).toHaveLength(1);
    expect(logs[0].duplicities[0].sn).toBe(1);
    expect(logs[0].duplicities[0].events.map((e) => e.message.said)).toEqual(['y', 'z']);
  });

  it('records the delegator from a delegated inception, null otherwise', () => {
    const { logs } = organize(
      result([
        msg({ i: 'CHILD', s: '0', t: 'dip', di: 'PARENT' }),
        msg({ i: 'CHILD', s: '1', t: 'ixn' }),
        msg({ i: 'ROOT', s: '0', t: 'icp' }),
      ]),
    );
    expect(logs.find((l) => l.aid === 'CHILD')!.delegator).toBe('PARENT');
    expect(logs.find((l) => l.aid === 'ROOT')!.delegator).toBeNull();
  });

  it('labels TEL logs and routes rpy and ACDC messages to loose in stream order', () => {
    const { logs, loose } = organize(
      result([
        msg({ i: 'REG', s: '0', t: 'vcp', d: 'v0' }), // TEL registry inception
        msg({ i: 'REG', s: '1', t: 'iss', d: 'v1' }),
        msg({ t: 'rpy', d: 'r1' }), // no i -> loose
        msg({ i: 'ACDC', s: 'ESchemaSaid', d: 'acdc1' }), // has i+s but no ilk -> loose (s is a schema SAID)
      ]),
    );
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ aid: 'REG', kind: 'TEL' });
    expect(loose.map((l) => l.message.said)).toEqual(['r1', 'acdc1']);
    expect(loose.map((l) => l.streamIndex)).toEqual([2, 3]);
  });

  it('routes a would-be event with an unparseable sequence number to loose', () => {
    const { logs, loose } = organize(result([msg({ i: 'A', s: 'zz', t: 'ixn', d: 'bad' })]));
    expect(logs).toEqual([]);
    expect(loose.map((l) => l.message.said)).toEqual(['bad']);
  });

  it('routes a would-be event missing its identifier to loose', () => {
    const { logs, loose } = organize(result([msg({ s: '0', t: 'icp', d: 'noi' })]));
    expect(logs).toEqual([]);
    expect(loose.map((l) => l.message.said)).toEqual(['noi']);
  });
});

describe('organize — real corpus', () => {
  const path = 'samples/multisig-oobi.cesr';
  const credPath = 'samples/credential.cesr';

  it.skipIf(!existsSync(path))('organizes multisig-oobi into 11 KEL logs, 8 loose rpy, 6 delegated', () => {
    const { logs, loose } = organize(walk(new Uint8Array(readFileSync(path))));
    expect(logs).toHaveLength(11);
    expect(logs.every((l) => l.kind === 'KEL')).toBe(true);
    expect(loose).toHaveLength(8);
    expect(loose.every((l) => l.message.ilk === 'rpy')).toBe(true);
    expect(logs.filter((l) => l.delegator).length).toBe(6); // the 6 delegated inceptions
    expect(logs.every((l) => l.gaps.length === 0 && l.duplicities.length === 0)).toBe(true);
  });

  it.skipIf(!existsSync(credPath))('organizes the credential corpus with TEL logs and ACDC bodies loose', () => {
    const { logs, loose } = organize(walk(new Uint8Array(readFileSync(credPath))));
    expect(logs.some((l) => l.kind === 'TEL')).toBe(true);
    expect(logs.some((l) => l.kind === 'KEL')).toBe(true);
    expect(loose.filter((l) => l.message.ilk === null)).toHaveLength(4); // the 4 ACDC bodies
  });
});
