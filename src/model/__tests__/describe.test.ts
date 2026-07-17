import { describe, it, expect } from 'vitest';
import { describeStream } from '../describe';
import type { CesrMessage } from '../../cesr/types';
import type { EventLog } from '../stream';

const msg = (over: Partial<CesrMessage>): CesrMessage => ({
  proto: 'KERI', version: '1.0', kind: 'JSON', ilk: 'icp', sn: '0', said: 'd', sad: {}, span: { start: 0, end: 0 }, attachments: [], ...over,
});
const log = (kind: 'KEL' | 'TEL'): EventLog => ({ aid: 'a', kind, events: [], delegator: null, gaps: [], duplicities: [] });

describe('describeStream', () => {
  it('returns null for an empty stream', () => {
    expect(describeStream([], [])).toBeNull();
  });

  it('calls an all-key-event stream a KEL and tallies ilks (commonest first) + identifiers', () => {
    const d = describeStream([msg({ ilk: 'icp' }), msg({ ilk: 'ixn' }), msg({ ilk: 'ixn' })], [log('KEL')]);
    expect(d?.kind).toBe('KEL (key event log)');
    expect(d?.composition).toBe('1 identifier · 2 ixn, 1 icp');
  });

  it('infers an OOBI / endpoint-reply stream from rpy messages', () => {
    const d = describeStream([msg({ ilk: 'icp' }), msg({ ilk: 'rpy' })], [log('KEL')]);
    expect(d?.kind).toBe('OOBI / endpoint reply stream');
  });

  it('marks a TEL when a log is a transaction event log', () => {
    const d = describeStream([msg({ ilk: 'vcp' })], [log('TEL')]);
    expect(d?.kind).toBe('TEL (transaction event log)');
  });

  it('calls anything else mixed, falls back to serialization kind for a null ilk, and pluralizes', () => {
    const d = describeStream([msg({ ilk: null, kind: 'CBOR' })], []); // ACDC-like: no ilk
    expect(d?.kind).toBe('mixed stream');
    expect(d?.composition).toBe('0 identifiers · 1 CBOR'); // plural + kind fallback
  });
});
