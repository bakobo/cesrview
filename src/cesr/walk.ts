/* CESR v1 stream walker (increment 1: message framing + top-level attachment groups).
 *
 * Frames a stream deterministically — no `{`-sniffing — using the version-string size and the
 * attachment counters, delegating primitive/counter sizing to signify-ts. Resilient: on a code it
 * cannot frame it stops and reports, returning everything parsed so far (decision d3rk6n). */

import { Counter, Indexer } from 'signify-ts';
import type { AttachmentGroup, CesrMessage, ParseError, WalkResult } from './types';

const td = new TextDecoder();
const OPEN = 0x7b; // '{'
const DASH = 0x2d; // '-'

/** v1 version string, e.g. `"v":"KERI10JSON00012b_"` -> proto KERI, ver 1.0, JSON, size 0x12b. */
const VERSION_RE = /"v"\s*:\s*"([A-Z]{4})(\d)(\d)([A-Z]{4})([0-9a-f]{6})_"/;

/** Counters whose count is in 4-byte quadlets of opaque material. */
const QUADLET = new Set(['-V', '-0V']);
/** Counters whose items are self-framing indexed signatures. */
const INDEXED_SIG = new Set(['-A', '-B']);

interface Version {
  proto: string;
  version: string;
  kind: string;
  size: number;
}

/** Parse the version string at `at`, or null if none is present in the leading window. */
export function parseVersion(bytes: Uint8Array, at: number): Version | null {
  const m = VERSION_RE.exec(td.decode(bytes.subarray(at, at + 128)));
  if (!m) return null;
  return { proto: m[1], version: `${m[2]}.${m[3]}`, kind: m[4], size: parseInt(m[5], 16) };
}

interface FramedGroup {
  group: AttachmentGroup;
  end: number; // byte offset just past the group (only meaningful when state === 'known')
}

/** Frame one attachment group at `at`. Returns null if the counter itself is unparseable. */
function frameGroup(bytes: Uint8Array, at: number): FramedGroup | null {
  let counter: Counter;
  try {
    counter = new Counter({ qb64: td.decode(bytes.subarray(at, at + 8)) });
  } catch {
    return null;
  }
  const { code, count } = counter;
  const headerLen = counter.qb64.length;

  if (QUADLET.has(code)) {
    const end = at + headerLen + count * 4;
    return { group: { code, count, span: { start: at, end }, state: 'known' }, end };
  }

  if (INDEXED_SIG.has(code)) {
    let p = at + headerLen;
    for (let k = 0; k < count; k++) {
      try {
        p += new Indexer({ qb64: td.decode(bytes.subarray(p, p + 100)) }).qb64.length;
      } catch {
        // a malformed item — we can no longer frame this group
        return { group: { code, count, span: { start: at, end: p }, state: 'invalid' }, end: p };
      }
    }
    return { group: { code, count, span: { start: at, end: p }, state: 'known' }, end: p };
  }

  // a recognized counter whose framing we do not yet model
  const end = at + headerLen;
  return { group: { code, count, span: { start: at, end }, state: 'unknown' }, end };
}

/** Walk a CESR stream into a provenance-carrying decomposition. */
export function walk(bytes: Uint8Array): WalkResult {
  const messages: CesrMessage[] = [];
  const errors: ParseError[] = [];
  const n = bytes.length;
  let i = 0;

  while (i < n) {
    if (bytes[i] !== OPEN) {
      errors.push({ message: `expected a message at byte ${i}`, span: { start: i, end: n } });
      break;
    }
    const ver = parseVersion(bytes, i);
    if (!ver) {
      errors.push({ message: `no version string at byte ${i}`, span: { start: i, end: n } });
      break;
    }
    const bodyEnd = i + ver.size;
    let sad: Record<string, unknown>;
    try {
      sad = JSON.parse(td.decode(bytes.subarray(i, bodyEnd)));
    } catch {
      errors.push({ message: `malformed message body at byte ${i}`, span: { start: i, end: bodyEnd } });
      break;
    }

    const attachments: AttachmentGroup[] = [];
    let j = bodyEnd;
    let stopped = false;
    while (j < n && bytes[j] === DASH) {
      const framed = frameGroup(bytes, j);
      if (!framed) {
        errors.push({ message: `unparseable counter at byte ${j}`, span: { start: j, end: n } });
        stopped = true;
        break;
      }
      attachments.push(framed.group);
      if (framed.group.state !== 'known') {
        errors.push({
          message: `cannot frame counter ${framed.group.code} at byte ${j}`,
          span: { start: j, end: n },
        });
        stopped = true;
        break;
      }
      j = framed.end;
    }

    messages.push({
      proto: ver.proto,
      version: ver.version,
      kind: ver.kind,
      ilk: typeof sad.t === 'string' ? sad.t : null,
      sn: typeof sad.s === 'string' ? sad.s : null,
      said: typeof sad.d === 'string' ? sad.d : null,
      sad,
      span: { start: i, end: bodyEnd },
      attachments,
    });

    i = j;
    if (stopped) break;
  }

  return { messages, errors, consumed: i };
}
