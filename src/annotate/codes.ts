/* cesrview annotation layer (decision x4nb7q, realizing w6ph4k).
 *
 * The product's teaching value-add: a hand-authored map from each STRUCTURAL CESR code (counter/
 * group codes, Matter/Indexer primitive codes) and each message ilk to a human gloss plus a deep
 * link to the relevant SPEC SECTION. This module is deliberately DECOUPLED from the walker — the
 * walker (src/cesr) imports nothing from here, so it stays a generic, upstreamable decomposition
 * (m4dp7k, n6wd3k) while the teaching content lives on top. Lookup is fail-soft: an unannotated
 * code returns null and its node still renders (the d3rk6n spirit). */

/** A human-facing annotation for a code: a plain-language gloss, a spec-section deep link, and an
 * optional exact phrase to target within that section via a URL text fragment (s9grn4). */
export interface Annotation {
  gloss: string;
  spec: string; // deep link to the relevant spec section (a fragment that exists in the page)
  find?: string; // exact phrase in that section for text-fragment precision; absent = section floor
}

/** Which code table a code belongs to. Matter and Indexer are separate because their codes collide
 * (e.g. 'A' is a seed as Matter but an indexed Ed25519 signature as Indexer) — see d7km3p. */
export type CodeCategory = 'counter' | 'matter' | 'indexer' | 'ilk';

const CESR = 'https://trustoverip.github.io/kswg-cesr-specification/';
const KERI = 'https://trustoverip.github.io/kswg-keri-specification/';
// Section anchors verified to exist in the published spec HTML (codes render in tables with no
// per-code ids, so these are the finest stable targets).
const CESR_COUNTER = `${CESR}#count-code-tables`;
const CESR_MATTER = `${CESR}#master-code-table-for-genusversion-_aaacaa-keriacdc-protocol-stack-version-200`;
const CESR_INDEXER = `${CESR}#indexed-code-table`;
// KERI message field labels live in one table; the `find` phrases below are the verbatim Title-column
// text for each label, so a text-fragment lands on the exact row (s9grn4).
const KERI_FIELDS = `${KERI}#keri-field-labels-for-data-structures`;

const COUNTER: Record<string, Annotation> = {
  '-A': { gloss: 'Controller indexed signatures — the controlling keypairs’ signatures on this event, each tagged with the index of the key that made it.', spec: CESR_COUNTER },
  '-B': { gloss: 'Witness indexed signatures — receipts from the designated witnesses, indexed by their position in the witness list.', spec: CESR_COUNTER },
  '-C': { gloss: 'Non-transferable receipt couples — (verifier prefix, signature) pairs receipted by non-transferable identifiers.', spec: CESR_COUNTER },
  '-D': { gloss: 'Transferable receipt quadruples — (prefix, sequence number, digest, indexed signature) receipted by a transferable identifier.', spec: CESR_COUNTER },
  '-E': { gloss: 'First-seen replay couples — (first-seen ordinal, datetime) recording when the receiver first saw an event, used for ordered replay.', spec: CESR_COUNTER },
  '-F': { gloss: 'Transferable indexed signature groups — an endorser located by (prefix, sequence number, digest) followed by its controller indexed signatures.', spec: CESR_COUNTER },
  '-G': { gloss: 'Seal source couples — (sequence number, digest) locating the event that anchors a seal within the same log.', spec: CESR_COUNTER },
  '-H': { gloss: 'Transferable last indexed signature groups — an endorser located by prefix (using its latest key state) followed by its indexed signatures.', spec: CESR_COUNTER },
  '-I': { gloss: 'Seal source triples — (prefix, sequence number, digest) locating an anchoring event in another identifier’s log.', spec: CESR_COUNTER },
  '-J': { gloss: 'SAD path signatures — signatures over a subgraph of a self-addressing data structure, addressed by a SAD path.', spec: CESR_COUNTER },
  '-K': { gloss: 'SAD path signature group — a path followed by the signature groups that sign the addressed subgraph.', spec: CESR_COUNTER },
  '-L': { gloss: 'Pathed material quadlets — a wrapper that sizes pathed attachment material in 4-byte quadlets.', spec: CESR_COUNTER },
  '-V': { gloss: 'Attached material quadlets — the universal pipeline wrapper whose count sizes all enclosed attachments in 4-byte quadlets.', spec: CESR_COUNTER },
  '-0V': { gloss: 'Big attached material quadlets — the large-count form of the universal attachment wrapper.', spec: CESR_COUNTER },
};

const MATTER: Record<string, Annotation> = {
  E: { gloss: 'Blake3-256 digest — a 32-byte hash, used for SAIDs and event digests.', spec: CESR_MATTER },
  D: { gloss: 'Ed25519 public key (transferable) — a verification key whose identifier may rotate.', spec: CESR_MATTER },
  B: { gloss: 'Ed25519 public key (non-transferable) — a verification key bound to an identifier that cannot rotate.', spec: CESR_MATTER },
  '0A': { gloss: 'A 128-bit fixed-size number — used for sequence numbers, salts, and thresholds (the Salt_128 code).', spec: CESR_MATTER },
  '0B': { gloss: 'Ed25519 signature (non-indexed) — a standalone signature, as carried in a receipt couple.', spec: CESR_MATTER },
  '1AAG': { gloss: 'Datetime — an ISO-8601 timestamp encoded as a fixed-length primitive (a Dater).', spec: CESR_MATTER },
};

const INDEXER: Record<string, Annotation> = {
  A: { gloss: 'Ed25519 indexed signature — a signature tagged with the index of the signing key in the key list.', spec: CESR_INDEXER },
  B: { gloss: 'Ed25519 current-only indexed signature — signed with the current key, carrying a single (signing) index.', spec: CESR_INDEXER },
  '2A': { gloss: 'Ed25519 big-index signature — an indexed Ed25519 signature with a large index.', spec: CESR_INDEXER },
};

const ILK: Record<string, Annotation> = {
  icp: { gloss: 'Inception — the first event of a key event log, establishing the identifier and its initial key state.', spec: `${KERI}#inception-icp` },
  rot: { gloss: 'Rotation — an establishment event that changes the identifier’s key state to the pre-rotated keys.', spec: `${KERI}#rotation-rot` },
  ixn: { gloss: 'Interaction — a non-establishment event that anchors data (seals) without changing key state.', spec: `${KERI}#interaction-ixn` },
  dip: { gloss: 'Delegated inception — the inception of an identifier whose authority is delegated by another.', spec: `${KERI}#delegated-inception-dip` },
  drt: { gloss: 'Delegated rotation — a rotation whose authority is confirmed by the delegating identifier.', spec: `${KERI}#delegated-rotation-drt` },
  rpy: { gloss: 'Reply — a routed message conveying signed non-event data such as end-role authorizations and OOBIs.', spec: `${KERI}#reply-message` },
  exn: { gloss: 'Exchange — a peer-to-peer message body used to carry application payloads between controllers.', spec: `${KERI}#exchange-message` },
};

// ~4kle — TEL/registry ilks (vcp, iss, rev, bis, brv) are intentionally not annotated yet: they are
// specified outside the CESR/KERI specs and lack a stable spec anchor to deep-link to.
export const DEFERRED_ILKS = ['vcp', 'iss', 'rev', 'bis', 'brv'] as const;

const TABLES: Record<CodeCategory, Record<string, Annotation>> = {
  counter: COUNTER,
  matter: MATTER,
  indexer: INDEXER,
  ilk: ILK,
};

/** Look up the teaching annotation for a code, or null if it is not annotated (fail-soft). */
export function annotate(category: CodeCategory, code: string): Annotation | null {
  return TABLES[category][code] ?? null;
}

// Short glosses for KERI/ACDC message FIELD KEYS, shown in parens beside the terse label so a
// reader need not memorize the single-letter schema. KEL/TEL senses (the common case); a few keys are
// context-dependent (e.g. `s`/`a` differ in ACDCs) — the KEL reading is used here.
// `gloss` is the concise inline label; `find` is the verbatim KERI-spec Title-column text (verified
// against the published spec) that a text fragment targets for precise navigation. Fields with no
// verified Title (dt/rd/ri/r are defined outside this table) link to the section floor, no `find`.
const FIELD: Record<string, Annotation> = {
  v: { gloss: 'version string', spec: KERI_FIELDS, find: 'Version String' },
  t: { gloss: 'message type', spec: KERI_FIELDS, find: 'Message Type' },
  d: { gloss: 'SAID', spec: KERI_FIELDS, find: 'Digest SAID' },
  i: { gloss: 'prefix/AID', spec: KERI_FIELDS, find: 'Identifier Prefix (AID)' },
  s: { gloss: 'sequence number', spec: KERI_FIELDS, find: 'Sequence Number' },
  p: { gloss: 'prior event digest', spec: KERI_FIELDS, find: 'Prior SAID' },
  kt: { gloss: 'signing threshold', spec: KERI_FIELDS, find: 'Keys Signing Threshold' },
  k: { gloss: 'signing keys', spec: KERI_FIELDS, find: 'List of Signing Keys (ordered key set)' },
  nt: { gloss: 'next (rotation) threshold', spec: KERI_FIELDS, find: 'Next Keys Signing Threshold' },
  n: { gloss: 'next key digests', spec: KERI_FIELDS, find: 'List of Next Key Digests (ordered key digest set)' },
  bt: { gloss: 'witness threshold', spec: KERI_FIELDS, find: 'Backer Threshold' },
  b: { gloss: 'witnesses', spec: KERI_FIELDS, find: 'List of Backers (ordered backer set of AIDs)' },
  br: { gloss: 'witnesses cut', spec: KERI_FIELDS, find: 'List of Backers to Remove (ordered backer set of AIDS)' },
  ba: { gloss: 'witnesses added', spec: KERI_FIELDS, find: 'List of Backers to Add (ordered backer set of AIDs)' },
  c: { gloss: 'config traits', spec: KERI_FIELDS, find: 'List of Configuration Traits/Modes' },
  a: { gloss: 'anchored seals', spec: KERI_FIELDS, find: 'List of Anchors (seals)' },
  di: { gloss: 'delegator prefix', spec: KERI_FIELDS, find: 'Delegator Identifier Prefix (AID)' },
  dt: { gloss: 'datetime', spec: KERI_FIELDS },
  rd: { gloss: 'registry digest', spec: KERI_FIELDS },
  ri: { gloss: 'registry identifier', spec: KERI_FIELDS },
  r: { gloss: 'route', spec: KERI_FIELDS },
};

/** The annotation for a message field key (`kt` → "signing threshold" + its spec deep-link), or null
 * if the key is not annotated (fail-soft). */
export function annotateField(key: string): Annotation | null {
  return FIELD[key] ?? null;
}
