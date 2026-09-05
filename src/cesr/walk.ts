/* CESR v1 stream walker (increment 1: message framing + top-level attachment groups).
 *
 * Frames a stream deterministically — no `{`-sniffing — using the version-string size and the
 * attachment counters, delegating primitive/counter sizing to signify-ts. Resilient: on a code it
 * cannot frame it stops and reports, returning everything parsed so far (decision d3rk6n). */

import { Counter, Indexer, Matter } from 'signify-ts';
import { pqSizage } from './pq';
import type {
  AttachmentGroup,
  AttachmentNode,
  BodyDecoder,
  CesrMessage,
  ParseError,
  Primitive,
  WalkOptions,
  WalkResult,
} from './types';

const td = new TextDecoder();
const DASH = 0x2d; // '-'

/** A CESR v1 version string as a BARE token, e.g. `KERI10JSON00012b_` -> proto KERI, ver 1.0, kind
 * JSON, size 0x12b. Matched without the JSON `"v":"..."` framing so it is found inside binary
 * CBOR/MGPK bodies too, where it still appears as ASCII (decision s7bk4m). */
const VERSION_RE = /([A-Z]{4})(\d)(\d)([A-Z]{4})([0-9a-f]{6})_/;

/** A CESR v2 (CESR 2.0) version string as a BARE token, e.g. `KERICAACAAJSONAAD_.` -> proto KERI,
 * protocol version 2.0, CESR genus version 2.0, kind JSON, size 255. Its layout is proto(4) +
 * protocol-major(1) + protocol-minor(2) + genus-major(1) + genus-minor(2) + kind(4) + size(4) +
 * '.' terminator, every field after the proto in base64url (decision q9rd3m). The embedded GENUS
 * version is what selects the v2 counter table downstream. */
const VERSION_RE_2 =
  /([A-Z]{4})([A-Za-z0-9_-])([A-Za-z0-9_-]{2})([A-Za-z0-9_-])([A-Za-z0-9_-]{2})([A-Z]{4})([A-Za-z0-9_-]{4})\./;

/** The CESR base64url alphabet, index = value (A=0 … _=63). */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
/** Decode a base64url token to its integer value (v2 sizes and counts are base64, not hex). */
function b64ToInt(s: string): number {
  let n = 0;
  for (const c of s) n = n * 64 + B64.indexOf(c);
  return n;
}

/** The built-in JSON body decoder (a language builtin — no dependency). */
const jsonDecoder: BodyDecoder = (body) => JSON.parse(td.decode(body));

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
  version: string; // the PROTOCOL version, e.g. '1.0' or '2.0'
  kind: string;
  size: number;
  genus: number; // the CESR GENUS major version (1 or 2) — selects the counter table (q9rd3m)
  length: number; // the version-string TOKEN's own length; a message cannot be shorter (jr9p4w)
}

/** Parse the version string at `at`, or null if none is present in the leading window. Tries the v2
 * layout first (its terminator and base64 fields cannot cross-match a v1 string, and vice versa),
 * then falls back to v1 (decision q9rd3m). The returned `genus` drives v1-vs-v2 counter framing. */
export function parseVersion(bytes: Uint8Array, at: number): Version | null {
  const window = td.decode(bytes.subarray(at, at + 128));
  const m2 = VERSION_RE_2.exec(window);
  if (m2) {
    return {
      proto: m2[1],
      version: `${b64ToInt(m2[2])}.${b64ToInt(m2[3])}`,
      kind: m2[6],
      size: b64ToInt(m2[7]),
      genus: b64ToInt(m2[4]),
      length: m2[0].length,
    };
  }
  const m1 = VERSION_RE.exec(window);
  if (!m1) return null;
  return {
    proto: m1[1],
    version: `${m1[2]}.${m1[3]}`,
    kind: m1[4],
    size: parseInt(m1[5], 16),
    genus: 1,
    length: m1[0].length,
  };
}

interface FramedGroup {
  group: AttachmentGroup;
  end: number; // byte offset just past the group (only meaningful when state === 'known')
}

/** Why an element could not be framed: `short` = the stream ends inside it, so more bytes would
 * complete it; `bad` = the bytes that ARE present cannot be framed (jr9p4w). Nothing but the size
 * tables can tell these apart, which is why sizing is probed before construction. */
type Shortfall = 'short' | 'bad';
/** A framing attempt: the framed node, or why it failed. */
type Attempt<T> = { node: T } | { fail: Shortfall };
const failed = <T>(a: Attempt<T>): a is { fail: Shortfall } => 'fail' in a;

/** The outcome of framing a run of attachment groups over a byte window. */
interface GroupSequence {
  items: AttachmentGroup[];
  end: number; // where framing stopped
  error?: ParseError; // set when framing halted on a group it could not frame
  short?: true; // the window ends inside an element — the caller decides whether that is an error
}

/** How a primitive is sized: its full qb64 length, and whether that length came from the
 * post-quantum overlay rather than from signify-ts (which decides how it is then framed). */
interface Sizing {
  fs: number;
  pq: boolean;
}

/** The full byte length of the primitive at `at`, read from the size tables BEFORE construction.
 * Probing rather than catching is what separates a truncated primitive from a malformed one: the
 * constructor throws for both (jr9p4w). signify-ts's tables are consulted first and the
 * post-quantum overlay only on a miss, so it can never shadow a delegated code (j2b7dw). */
function probePrimitive(bytes: Uint8Array, at: number, part: PrimitivePart): Attempt<Sizing> {
  const hards = part === 'sig' ? Indexer.Hards : Matter.Hards;
  const sizes = part === 'sig' ? Indexer.Sizes : Matter.Sizes;
  const avail = bytes.length - at;
  if (avail <= 0) return { fail: 'short' };
  const head = td.decode(bytes.subarray(at, at + 8));
  const hs = hards.get(head[0]);
  if (hs === undefined) return { fail: 'bad' }; // an unrecognized selector is wrong, not short
  if (avail < hs) return { fail: 'short' }; // the hard code itself is cut off
  const code = head.slice(0, hs);
  const sizage = sizes.get(code);
  if (!sizage) {
    // signify-ts does not know this code. A CESR v1.1 post-quantum code is not wrong, only
    // unshipped, so the overlay answers for it (j2b7dw). Matter codes ONLY: v1.1 defines no
    // indexed post-quantum signature, so an indexed part must never resolve here (z9puaw).
    const pq = part === 'sig' ? undefined : pqSizage(code);
    if (!pq) return { fail: 'bad' };
    return avail < pq.fs ? { fail: 'short' } : { node: { fs: pq.fs, pq: true } };
  }
  // A variable-size code carries no full size — signify-ts stores that as null, which its own
  // `fs?: number` type does not admit, so this tests the VALUE rather than trusting the type. `fs <
  // 0` alone would let null through (null >= 0 is true) and hand back a null length.
  const fs = sizage.fs;
  if (typeof fs !== 'number' || fs < 0) return { fail: 'bad' }; // variable-size: unsupported upstream
  return avail < fs ? { fail: 'short' } : { node: { fs, pq: false } };
}

/** Frame one primitive of the given part kind at `at`, delegating sizing to signify-ts. */
function framePrimitive(bytes: Uint8Array, at: number, part: PrimitivePart): Attempt<Primitive> {
  const probe = probePrimitive(bytes, at, part);
  if (failed(probe)) return probe;
  const { fs, pq } = probe.node;
  const q = td.decode(bytes.subarray(at, at + fs));
  if (pq) {
    // A post-quantum primitive cannot go through signify-ts's Matter — it would throw on the
    // unknown code — so it is framed straight from the table (j2b7dw). The walker needs a code and
    // a span, never raw bytes. Its value is still checked for base64url, so corrupt material is
    // 'bad' rather than framed on the strength of its first four characters alone.
    if (!/^[A-Za-z0-9_-]+$/.test(q)) return { fail: 'bad' };
    return { node: { kind: 'primitive', code: q.slice(0, 4), class: 'matter', span: { start: at, end: at + fs } } };
  }
  try {
    const prim = part === 'sig' ? new Indexer({ qb64: q }) : new Matter({ qb64: q });
    const cls = part === 'sig' ? 'indexer' : 'matter';
    return { node: { kind: 'primitive', code: prim.code, class: cls, span: { start: at, end: at + prim.qb64.length } } };
  } catch {
    return { fail: 'bad' };
  }
}

/* --- CESR 2.0 (genus 2) counter tables (decisions f2wn8k / q9rd3m). --------------------------------
 * signify-ts 0.4.0 carries only the v1 counter table and SILENTLY MISFRAMES v2 codes (they collide
 * with v1 strings but differ in meaning), so v2 counters are framed natively here, ground-truthed to
 * keripy 2.0's counting.py CtrDex_2_0. Two facts make v2 framing uniform: every v2 group counts its
 * body in QUADLETS (so it is self-framing as count*4 bytes, like the v1 -V wrapper), and every
 * primitive/nested-counter start is unambiguous ('-' begins a counter, never a primitive). */
const V2_GENUS_CODE = '-_AAA'; // KERI/ACDC stack genus-version counter (bodyless declaration)
const V2_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabc'; // the defined CtrDex_2_0 code letters
const V2_KNOWN = new Set<string>([V2_GENUS_CODE]);
for (const c of V2_LETTERS) {
  V2_KNOWN.add(`-${c}`); // regular (hard 2, soft 2)
  V2_KNOWN.add(`--${c}`); // big (hard 3, soft 5)
}
// Codes whose DIRECT bare primitives are indexed signatures (Indexer), not Matter (d7km3p):
// ControllerIdxSigs / WitnessIdxSigs and their big forms. All other groups hold Matter primitives
// and/or nested groups.
const V2_SIG_CODES = new Set(['-K', '-L', '--K', '--L']);

/** Parse a v2 counter header at `at`: its code (hard) and quadlet count (soft), or null if the soft
 * count is not base64. Both callers guarantee `bytes[at]` is '-' (they test DASH first), so the lead
 * '-' is a precondition. The hard/soft split is fixed by the first two chars — `--` big (3/5), `-_`
 * genus (5/3), else regular (2/2) — per keripy's v2 Sizes table. */
function parseV2Counter(
  bytes: Uint8Array,
  at: number
): Attempt<{ code: string; count: number; headerLen: number }> {
  const b = td.decode(bytes.subarray(at, at + 8));
  const [hs, ss] = b[1] === '-' ? [3, 5] : b[1] === '_' ? [5, 3] : [2, 2];
  const code = b.slice(0, hs);
  const soft = b.slice(hs, hs + ss);
  // A header cut off by the end of the stream is short, not malformed (jr9p4w); a full-length soft
  // that is not base64 is malformed.
  if (bytes.length - at < hs + ss) return { fail: 'short' };
  // The bytes are there, so a decode that yields fewer CHARS than the header needs means they are
  // not the ASCII a counter header is made of.
  if (soft.length < ss || !/^[A-Za-z0-9_-]+$/.test(soft)) return { fail: 'bad' };
  return { node: { code, count: b64ToInt(soft), headerLen: hs + ss } };
}

/** Frame the enclosed material of a v2 group over [start, limit): a run of nested counters and/or
 * primitives (Indexer when `sigCtx`, else Matter). Stops at the first element it cannot frame within
 * the bound — the enclosing group's size is already known (count*4), so this is a RESILIENCE BOUNDARY
 * (p3wk7n): a partial decode never condemns the self-framed wrapper. */
function frameEnclosedV2(bytes: Uint8Array, start: number, limit: number, sigCtx: boolean): AttachmentNode[] {
  const items: AttachmentNode[] = [];
  let p = start;
  while (p < limit) {
    if (bytes[p] === DASH) {
      const nested = frameGroupV2(bytes, p);
      if (failed(nested) || nested.node.end > limit) break;
      items.push(nested.node.group);
      p = nested.node.end;
    } else {
      const prim = framePrimitive(bytes, p, sigCtx ? 'sig' : 'p');
      if (failed(prim) || prim.node.span.end > limit) break;
      items.push(prim.node);
      p = prim.node.span.end;
    }
  }
  return items;
}

/** Frame one v2 (genus 2) attachment group at `at`. Every v2 group self-frames as count*4 bytes, so
 * even an unrecognized code is UNKNOWN-BUT-FRAMED (d3rk6n) with a known span; only a genus-version
 * counter (`-_…`) is bodyless. Returns null only when the counter header itself is unparseable. */
function frameGroupV2(bytes: Uint8Array, at: number): Attempt<FramedGroup> {
  const hdr = parseV2Counter(bytes, at);
  if (failed(hdr)) return hdr;
  const { code, count, headerLen } = hdr.node;
  const base = { kind: 'group' as const, code, count, genus: 2 };
  if (code[1] === '_') {
    // a genus/version counter declares the CESR genus for the following material; it has no quadlet body
    const end = at + headerLen;
    const state = code === V2_GENUS_CODE ? 'known' : 'unknown';
    return { node: { group: { ...base, span: { start: at, end }, state, items: [] }, end } };
  }
  const innerStart = at + headerLen;
  const innerEnd = innerStart + count * 4; // self-framing: the count is quadlets of enclosed material
  // Self-framing cuts both ways: a count that runs past the end of the stream means the group is not
  // all here yet, so it is short rather than framed (jr9p4w).
  if (innerEnd > bytes.length) return { fail: 'short' };
  if (!V2_KNOWN.has(code)) {
    return { node: { group: { ...base, span: { start: at, end: innerEnd }, state: 'unknown', items: [] }, end: innerEnd } };
  }
  const items = frameEnclosedV2(bytes, innerStart, innerEnd, V2_SIG_CODES.has(code));
  return { node: { group: { ...base, span: { start: at, end: innerEnd }, state: 'known', items }, end: innerEnd } };
}

/** Frame one attachment group at `at`, dispatching by CESR genus (q9rd3m): genus 2 uses the native
 * v2 tables above; genus 1 delegates counter sizing to signify-ts. Returns null if the counter itself
 * is unparseable. */
function frameGroup(bytes: Uint8Array, at: number, genus: number): Attempt<FramedGroup> {
  if (genus === 2) return frameGroupV2(bytes, at);
  // A counter header cut off by the end of the stream is short, not unparseable (jr9p4w), so the
  // header's own length is checked against the tables before Counter is asked to parse it.
  const avail = bytes.length - at;
  const head = td.decode(bytes.subarray(at, at + 8));
  if (avail < 2) return { fail: 'short' }; // not even the two-character selector is here
  const hs = Counter.Hards.get(head.slice(0, 2));
  if (hs === undefined) return { fail: 'bad' };
  if (avail < hs) return { fail: 'short' };
  const sizage = Counter.Sizes.get(head.slice(0, hs));
  if (!sizage) return { fail: 'bad' };
  if (avail < sizage.hs + sizage.ss) return { fail: 'short' };
  let counter: Counter;
  try {
    counter = new Counter({ qb64: head });
  } catch {
    return { fail: 'bad' };
  }
  const { code, count } = counter;
  const headerLen = counter.qb64.length;
  const base = { kind: 'group' as const, code, count, genus: 1 };
  const spec = GROUP_SPEC[code];

  if (!spec) {
    // ~4ptb — a recognized counter (e.g. -J/-K SadPathSig groups) whose inner framing we do not yet
    // model: framed structurally as far as its header, marked unknown (decision d3rk6n).
    const end = at + headerLen;
    return { node: { group: { ...base, span: { start: at, end }, state: 'unknown', items: [] }, end } };
  }

  if (spec.quadlet) {
    // A material-quadlet wrapper self-declares its size as count*4, so it is always framed; only
    // its inner content varies in how (or whether) we decompose it.
    const innerStart = at + headerLen;
    const innerEnd = innerStart + count * 4;
    // ...unless the declared quadlets run past the end of the stream, in which case the wrapper is
    // not all here yet: short, not framed (jr9p4w).
    if (innerEnd > bytes.length) return { fail: 'short' };
    if (code === '-L') {
      // ~3cep — -L (PathedMaterialQuadlets) leads with a path primitive, not a plain group run;
      // its inner decomposition is deferred, so the quadlet body stays opaque for now.
      return { node: { group: { ...base, span: { start: at, end: innerEnd }, state: 'known', items: [] }, end: innerEnd } };
    }
    // -V / -0V universal wrappers: recurse into a typed nested group sequence (decision z4pm7k).
    // The wrapper's size is self-declaring (count*4), so it is a RESILIENCE BOUNDARY (tension
    // p3wk7n): inner decomposition proceeds as far as it can, an inner limit stops decomposing THIS
    // wrapper without condemning it, and framing resumes at innerEnd — so decomposing a wrapper is
    // never less resilient than leaving it opaque. The undecoded groups are simply absent (or a
    // recognised-but-unmodelled counter is left as an "unknown" child) among the wrapper's items.
    const seq = frameGroupSequence(bytes, innerStart, innerEnd, 1);
    return {
      node: { group: { ...base, span: { start: at, end: innerEnd }, state: 'known', items: seq.items }, end: innerEnd },
    };
  }

  // A counted group is NOT self-framing: its length is the sum of its items', so running out of
  // bytes partway through is indistinguishable from a bad item unless the shortfall says which
  // (jr9p4w). A shortfall propagates; a bad item leaves the group invalid, as before.
  const parts = spec.parts as Part[];
  const items: AttachmentNode[] = [];
  let p = at + headerLen;
  for (let k = 0; k < count; k++) {
    for (const part of parts) {
      if (part === 'grp') {
        // a nested attachment group (the -A ControllerIdxSigs inside a -F/-H); frame it recursively
        // and require it fully known, else this item — and so this group — cannot be framed
        const nested = frameGroup(bytes, p, 1);
        if (failed(nested)) {
          if (nested.fail === 'short') return nested;
          return { node: { group: { ...base, span: { start: at, end: p }, state: 'invalid', items }, end: p } };
        }
        if (nested.node.group.state !== 'known') {
          return { node: { group: { ...base, span: { start: at, end: p }, state: 'invalid', items }, end: p } };
        }
        items.push(nested.node.group);
        p = nested.node.end;
      } else {
        const prim = framePrimitive(bytes, p, part);
        if (failed(prim)) {
          if (prim.fail === 'short') return prim;
          // a malformed item — we can no longer frame this group
          return { node: { group: { ...base, span: { start: at, end: p }, state: 'invalid', items }, end: p } };
        }
        items.push(prim.node);
        p = prim.node.span.end;
      }
    }
  }
  return { node: { group: { ...base, span: { start: at, end: p }, state: 'known', items }, end: p } };
}

/** Frame a run of attachment counters over [start, limit) for the given genus. Stops at `limit`, at
 * the first byte that is not a counter, or at the first counter it cannot frame (recording a typed
 * error). Shared by the top-level attachment loop and the v1 -V/-0V wrapper recursion (z4pm7k). Under
 * genus 2 every counter self-frames (count*4), so an UNKNOWN code is framed-and-continued rather than
 * halting — only an unparseable header stops the run (q9rd3m); under genus 1 an unframable body halts,
 * since v1 cannot size an unrecognized group. */
function frameGroupSequence(bytes: Uint8Array, start: number, limit: number, genus: number): GroupSequence {
  const items: AttachmentGroup[] = [];
  let pos = start;
  while (pos < limit && bytes[pos] === DASH) {
    const framed = frameGroup(bytes, pos, genus);
    if (failed(framed)) {
      // A group the stream ends inside is reported as a shortfall, not an error: only the caller
      // knows whether this window is the live end of the stream (incomplete) or the inside of a
      // sized wrapper, where the wrapper's own bytes are all present and p3wk7n contains it.
      if (framed.fail === 'short') return { items, end: pos, short: true };
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
    // A group that frames past this window belongs to no one: stop, and let the enclosing wrapper's
    // declared size carry the walk forward (p3wk7n). At the top level `limit` is the end of the
    // stream, and frameGroup already reported that case as short.
    if (framed.node.end > limit) break;
    items.push(framed.node.group);
    if (genus !== 2 && framed.node.group.state !== 'known') {
      return {
        items,
        end: pos,
        error: {
          code: 'unframable-group',
          message: `The ${framed.node.group.code} group at byte ${pos} could not be framed.`,
          span: { start: pos, end: limit },
          permanent: true,
        },
      };
    }
    pos = framed.node.end;
  }
  return { items, end: pos };
}

/** Walk a CESR stream into a provenance-carrying decomposition. Body decoding is pluggable
 * (decision s7bk4m): JSON is built in, and other serializations (CBOR/MGPK) are decoded only when a
 * decoder for their kind is injected via `opts.decoders`; an undecoded body is framed with sad=null. */
export function walk(bytes: Uint8Array, opts: WalkOptions = {}): WalkResult {
  const decoders: Record<string, BodyDecoder> = { JSON: jsonDecoder, ...opts.decoders };
  const messages: CesrMessage[] = [];
  const errors: ParseError[] = [];
  const n = bytes.length;
  let i = 0;

  while (i < n) {
    // a message is marked by its version string (near the start in every serialization), not by a
    // leading '{' — CBOR/MGPK bodies begin with a map-header byte (decision s7bk4m)
    const ver = parseVersion(bytes, i);
    if (!ver) {
      errors.push({
        code: 'no-version-string',
        message: `No CESR version string was found at byte ${i}; this is not a recognizable message.`,
        span: { start: i, end: n },
        permanent: true,
      });
      break;
    }
    if (ver.size < ver.length) {
      // A message cannot be shorter than the version string inside it. Rejecting this is also what
      // guarantees the loop ADVANCES: bodyEnd > i on every iteration, so a size of 0 can no longer
      // spin here forever, allocating a message per pass (jr9p4w).
      errors.push({
        code: 'invalid-version-size',
        message: `The version string at byte ${i} declares a size of ${ver.size} bytes, too small to contain the version string itself.`,
        span: { start: i, end: n },
        permanent: true,
      });
      break;
    }
    const bodyEnd = i + ver.size;
    if (bodyEnd > n) {
      // The declared size runs past the end of the stream. Note that `subarray` would have CLAMPED
      // silently here, so without this check a truncated message decodes as a whole one (jr9p4w).
      errors.push({
        code: 'incomplete',
        message: `The message at byte ${i} declares ${ver.size} bytes but only ${n - i} are present.`,
        span: { start: i, end: n },
        permanent: false,
      });
      break; // `i` is left at the message start, so a caller can append bytes and re-walk (z3fn5v)
    }
    const decoder = decoders[ver.kind]; // undefined if no decoder is available for this serialization
    let sad: Record<string, unknown> | null = null;
    if (decoder) {
      try {
        sad = decoder(bytes.subarray(i, bodyEnd));
      } catch {
        errors.push({
          code: 'malformed-body',
          message: `The message body at byte ${i} is not valid ${ver.kind}.`,
          span: { start: i, end: bodyEnd },
          permanent: true,
        });
        break;
      }
    }
    // when no decoder handles this serialization, the body is framed but left undecoded (sad = null)

    const seq = frameGroupSequence(bytes, bodyEnd, n, ver.genus);
    if (seq.short) {
      // The stream ends inside this message's attachments. The message body is whole, but emitting
      // it would double-emit when the caller comes back with the rest, so the whole message waits
      // and `consumed` stays at its first byte (z3fn5v).
      errors.push({
        code: 'incomplete',
        message: `The attachments of the message at byte ${i} end mid-element at byte ${n}.`,
        span: { start: i, end: n },
        permanent: false,
      });
      break;
    }
    messages.push({
      proto: ver.proto,
      version: ver.version,
      kind: ver.kind,
      ilk: sad && typeof sad.t === 'string' ? sad.t : null,
      sn: sad && typeof sad.s === 'string' ? sad.s : null,
      said: sad && typeof sad.d === 'string' ? sad.d : null,
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
