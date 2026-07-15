/* cesrview stream model (decision w3rn6k, realizing k2vx5n).
 *
 * A cesrview-side organization of the walker's WalkResult — NOT part of the walker, which stays a
 * generic upstreamable decomposition. organize() groups every sequenced event into an EventLog by
 * owning AID, labels each log KEL or TEL from its ilks, surfaces sequence gaps, duplicity and
 * delegation, and keeps every non-log ("loose") message in stream order. */

import type { CesrMessage, WalkResult } from '../cesr/types';

const KEL_ILKS = new Set(['icp', 'rot', 'ixn', 'dip', 'drt']);
const TEL_ILKS = new Set(['vcp', 'vrt', 'iss', 'rev', 'bis', 'brv']);

/** One event within a log: the walked message plus its numeric sn and stream position. The ilk and
 * SAID are read from `message` (message.ilk / message.said) rather than duplicated here. */
export interface LogEvent {
  message: CesrMessage;
  sn: number;
  streamIndex: number;
}

/** A sequence number carrying more than one event — a fork/duplicity. */
export interface Duplicity {
  sn: number;
  events: LogEvent[];
}

/** One identifier's ordered event log, labelled KEL or TEL. */
export interface EventLog {
  aid: string;
  kind: 'KEL' | 'TEL';
  events: LogEvent[]; // ordered by numeric sn, then stream order
  delegator: string | null; // the `di` on the inception, if delegated
  gaps: number[]; // missing sequence numbers in [0, maxSn]
  duplicities: Duplicity[];
}

/** A message that is not a sequenced log event (rpy, exn, an ACDC body, …). */
export interface LooseMessage {
  message: CesrMessage;
  streamIndex: number;
}

/** The organized view of a walked stream: logs by owner, plus loose messages in stream order. */
export interface StreamModel {
  logs: EventLog[];
  loose: LooseMessage[];
}

/** Sort a log's events, then compute its gaps and duplicities. */
function finalize(log: EventLog): EventLog {
  log.events.sort((a, b) => a.sn - b.sn || a.streamIndex - b.streamIndex);
  const bySn = new Map<number, LogEvent[]>();
  for (const e of log.events) {
    const at = bySn.get(e.sn);
    if (at) at.push(e);
    else bySn.set(e.sn, [e]);
  }
  const duplicities: Duplicity[] = [];
  bySn.forEach((events, sn) => {
    if (events.length > 1) duplicities.push({ sn, events });
  });
  log.duplicities = duplicities.sort((a, b) => a.sn - b.sn);

  const maxSn = log.events[log.events.length - 1].sn; // a log always has at least one event
  const gaps: number[] = [];
  for (let n = 0; n <= maxSn; n++) if (!bySn.has(n)) gaps.push(n);
  log.gaps = gaps;
  return log;
}

/** Organize a walked stream into labelled KEL/TEL logs plus loose messages (decision w3rn6k). */
export function organize(result: WalkResult): StreamModel {
  const byAid = new Map<string, EventLog>();
  const order: string[] = []; // AIDs in first-appearance order
  const loose: LooseMessage[] = [];

  result.messages.forEach((message, streamIndex) => {
    const ilk = message.ilk;
    const kind: 'KEL' | 'TEL' | null = ilk && KEL_ILKS.has(ilk) ? 'KEL' : ilk && TEL_ILKS.has(ilk) ? 'TEL' : null;
    const aid = message.sad?.i; // undefined for an undecoded (frame-only) body -> falls to loose
    const sn = typeof message.sn === 'string' ? parseInt(message.sn, 16) : NaN;

    if (kind && typeof aid === 'string' && Number.isInteger(sn)) {
      let log = byAid.get(aid);
      if (!log) {
        log = { aid, kind, events: [], delegator: null, gaps: [], duplicities: [] };
        byAid.set(aid, log);
        order.push(aid);
      }
      const di = message.sad!.di; // in this branch the ilk is set, so the body was decoded (sad non-null)
      if (typeof di === 'string') log.delegator = di;
      log.events.push({ message, sn, streamIndex });
    } else {
      loose.push({ message, streamIndex });
    }
  });

  return { logs: order.map((aid) => finalize(byAid.get(aid)!)), loose };
}
