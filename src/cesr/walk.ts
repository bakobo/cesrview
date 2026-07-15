/* CESR v1 stream walker (increment 1: message framing + top-level attachment groups).
 *
 * Frames a stream deterministically — no `{`-sniffing — using the version-string size and the
 * attachment counters, delegating primitive/counter sizing to signify-ts. Resilient: on a code it
 * cannot frame it stops and reports, returning everything parsed so far (decision d3rk6n). */

import { Counter, Indexer, Matter } from 'signify-ts';
import type { AttachmentGroup, AttachmentNode, CesrMessage, ParseError, Primitive, WalkResult } from './types';

const td = new TextDecoder();
const OPEN = 0x7b; // '{'
const DASH = 0x2d; // '-'

/** v1 version string, e.g. `"v":"KERI10JSON00012b_"` -> proto KERI, ver 1.0, JSON, size 0x12b. */
const VERSION_RE = /"v"\s*:\s*"([A-Z]{4})(\d)(\d)([A-Z]{4})([0-9a-f]{6})_"/;

/** One element of a group item: a primitive (`p` = Matter, `sig` = indexed Indexer) or `grp` = one
 * nested attachment group (e.g. the -A ControllerIdxSigs inside a -F/-H). */
type PrimitivePart = 'p' | 'sig';
type Part = PrimitivePart | 'grp';
interface GroupSpec {
  quadlet?: boolean;
  parts?: Part[]; // the element sequence of ONE item; repeated `count` times
}
const GROUP_SPEC: Record<string, GroupSpec> = {
  '-V': { quadlet: true }, // AttachedMaterialQuadlets (universal wrapper)
  '-0V': { quadlet: true }, // BigAttachedMaterialQuadlets
  '-L': { quadlet: true }, // PathedMaterialQuadlets
  '-A': { parts: ['sig'] }, // ControllerIdxSigs
  '-B': { parts: ['sig'] }, // WitnessIdxSigs
  '-C': { parts: ['p', 'p'] }, // NonTransReceiptCouples (verfer, cigar)
  '-D': { parts: ['p', 'p', 'p', 'sig'] }, // TransReceiptQuadruples (prefixer, seqner, saider, siger)
  '-E': { parts: ['p', 'p'] }, // FirstSeenReplayCouples (seqner, dater)
  '-F': { parts: ['p', 'p', 'p', 'grp'] }, // TransIdxSigGroups (prefixer, seqner, saider, nested -A)
  '-G': { parts: ['p', 'p'] }, // SealSourceCouples (seqner, saider)
  '-H': { parts: ['p', 'grp'] }, // TransLastIdxSigGroups (prefixer, nested -A)
  '-I': { parts: ['p', 'p', 'p'] }, // SealSourceTriples (prefixer, seqner, saider)
};

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

/** The outcome of framing a run of attachment groups over a byte window. */
interface GroupSequence {
  items: AttachmentGroup[];
  end: number; // where framing stopped
  error?: ParseError; // set when framing halted on a group it could not frame
}

/** Frame one primitive of the given part kind at `at`, delegating sizing to signify-ts. */
function framePrimitive(bytes: Uint8Array, at: number, part: PrimitivePart): Primitive | null {
  const q = td.decode(bytes.subarray(at, at + 128));
  try {
    const prim = part === 'sig' ? new Indexer({ qb64: q }) : new Matter({ qb64: q });
    const cls = part === 'sig' ? 'indexer' : 'matter';
    return { kind: 'primitive', code: prim.code, class: cls, span: { start: at, end: at + prim.qb64.length } };
  } catch {
    return null;
  }
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
  const base = { kind: 'group' as const, code, count };
  const spec = GROUP_SPEC[code];

  if (!spec) {
    // ~4ptb — a recognized counter (e.g. -J/-K SadPathSig groups) whose inner framing we do not yet
    // model: framed structurally as far as its header, marked unknown (decision d3rk6n).
    const end = at + headerLen;
    return { group: { ...base, span: { start: at, end }, state: 'unknown', items: [] }, end };
  }

  if (spec.quadlet) {
    // A material-quadlet wrapper self-declares its size as count*4, so it is always framed; only
    // its inner content varies in how (or whether) we decompose it.
    const innerStart = at + headerLen;
    const innerEnd = innerStart + count * 4;
    if (code === '-L') {
      // ~3cep — -L (PathedMaterialQuadlets) leads with a path primitive, not a plain group run;
      // its inner decomposition is deferred, so the quadlet body stays opaque for now.
      return { group: { ...base, span: { start: at, end: innerEnd }, state: 'known', items: [] }, end: innerEnd };
    }
    // -V / -0V universal wrappers: recurse into a typed nested group sequence (decision z4pm7k).
    // The wrapper's size is self-declaring (count*4), so it is a RESILIENCE BOUNDARY (tension
    // p3wk7n): inner decomposition proceeds as far as it can, an inner limit stops decomposing THIS
    // wrapper without condemning it, and framing resumes at innerEnd — so decomposing a wrapper is
    // never less resilient than leaving it opaque. The undecoded groups are simply absent (or a
    // recognised-but-unmodelled counter is left as an "unknown" child) among the wrapper's items.
    const seq = frameGroupSequence(bytes, innerStart, innerEnd);
    return { group: { ...base, span: { start: at, end: innerEnd }, state: 'known', items: seq.items }, end: innerEnd };
  }

  const parts = spec.parts as Part[];
  const items: AttachmentNode[] = [];
  let p = at + headerLen;
  for (let k = 0; k < count; k++) {
    for (const part of parts) {
      if (part === 'grp') {
        // a nested attachment group (the -A ControllerIdxSigs inside a -F/-H); frame it recursively
        // and require it fully known, else this item — and so this group — cannot be framed
        const nested = frameGroup(bytes, p);
        if (!nested || nested.group.state !== 'known') {
          return { group: { ...base, span: { start: at, end: p }, state: 'invalid', items }, end: p };
        }
        items.push(nested.group);
        p = nested.end;
      } else {
        const prim = framePrimitive(bytes, p, part);
        if (!prim) {
          // a malformed item — we can no longer frame this group
          return { group: { ...base, span: { start: at, end: p }, state: 'invalid', items }, end: p };
        }
        items.push(prim);
        p = prim.span.end;
      }
    }
  }
  return { group: { ...base, span: { start: at, end: p }, state: 'known', items }, end: p };
}

/** Frame a run of attachment groups over [start, limit). Stops at `limit`, at the first byte that
 * is not a counter, or at the first group it cannot frame (recording a typed error). Shared by the
 * top-level attachment loop and the -V/-0V wrapper recursion, so both frame identically (z4pm7k). */
function frameGroupSequence(bytes: Uint8Array, start: number, limit: number): GroupSequence {
  const items: AttachmentGroup[] = [];
  let pos = start;
  while (pos < limit && bytes[pos] === DASH) {
    const framed = frameGroup(bytes, pos);
    if (!framed) {
      return {
        items,
        end: pos,
        error: {
          code: 'unparseable-counter',
          message: `The attachment counter at byte ${pos} is not a recognized CESR code.`,
          span: { start: pos, end: limit },
          permanent: true,
        },
      };
    }
    items.push(framed.group);
    if (framed.group.state !== 'known') {
      return {
        items,
        end: pos,
        error: {
          code: 'unframable-group',
          message: `The ${framed.group.code} group at byte ${pos} could not be framed.`,
          span: { start: pos, end: limit },
          permanent: true,
        },
      };
    }
    pos = framed.end;
  }
  return { items, end: pos };
}

/** Walk a CESR stream into a provenance-carrying decomposition. */
export function walk(bytes: Uint8Array): WalkResult {
  const messages: CesrMessage[] = [];
  const errors: ParseError[] = [];
  const n = bytes.length;
  let i = 0;

  while (i < n) {
    if (bytes[i] !== OPEN) {
      errors.push({
        code: 'not-a-message',
        message: `A message must begin with '{', but byte ${i} does not.`,
        span: { start: i, end: n },
        permanent: true,
      });
      break;
    }
    const ver = parseVersion(bytes, i);
    if (!ver) {
      errors.push({
        code: 'no-version-string',
        message: `No version string was found in the message beginning at byte ${i}.`,
        span: { start: i, end: n },
        permanent: true,
      });
      break;
    }
    const bodyEnd = i + ver.size;
    let sad: Record<string, unknown>;
    try {
      sad = JSON.parse(td.decode(bytes.subarray(i, bodyEnd)));
    } catch {
      errors.push({
        code: 'malformed-body',
        message: `The message body at byte ${i} is not valid JSON.`,
        span: { start: i, end: bodyEnd },
        permanent: true,
      });
      break;
    }

    const seq = frameGroupSequence(bytes, bodyEnd, n);
    messages.push({
      proto: ver.proto,
      version: ver.version,
      kind: ver.kind,
      ilk: typeof sad.t === 'string' ? sad.t : null,
      sn: typeof sad.s === 'string' ? sad.s : null,
      said: typeof sad.d === 'string' ? sad.d : null,
      sad,
      span: { start: i, end: bodyEnd },
      attachments: seq.items,
    });

    i = seq.end;
    if (seq.error) {
      // A top-level group we cannot frame has no enclosing wrapper size to resync from, so the walk
      // halts here (tension p3wk7n: only size-known wrappers are resilience boundaries). A wrong
      // wrapper count*4 also surfaces here, by desynchronising the next message boundary.
      errors.push(seq.error);
      break;
    }
  }

  return { messages, errors, consumed: i };
}
