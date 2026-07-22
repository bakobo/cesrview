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
// Each field deep-links to the section where its concept is EXPLAINED (not the field-labels glossary
// table), with a `find` phrase verified to occur exactly once in that section (s9grn4). KERI_FIELDS
// (the glossary table) is the floor only for fields with no dedicated explanatory section.
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

// The CESR 2.0 (genus 2) counter table (keripy CtrDex_2_0). The code STRINGS collide with the v1
// table above but denote different groups, so v2 lookups use this table, selected by the group's
// genus (decision a7kp2v). Anchored to the same count-code-tables section (the spec renders both
// genera there). Only the load-bearing groups are glossed; unglossed codes fail soft (d3rk6n).
const COUNTER_2: Record<string, Annotation> = {
  '-A': { gloss: 'Generic group — a universal count-coded group whose enclosed material is sized in 4-byte quadlets.', spec: CESR_COUNTER },
  '-B': { gloss: 'Message-body-plus-attachments group — a universal wrapper enclosing a message body together with its attachments.', spec: CESR_COUNTER },
  '-C': { gloss: 'Attachment group — the universal wrapper whose count sizes all enclosed attachments in 4-byte quadlets (the v2 counterpart of v1’s -V).', spec: CESR_COUNTER },
  '-K': { gloss: 'Controller indexed signatures — the controlling keypairs’ signatures on this event, each tagged with the index of the key that made it.', spec: CESR_COUNTER },
  '-L': { gloss: 'Witness indexed signatures — receipts from the designated witnesses, indexed by their position in the witness list.', spec: CESR_COUNTER },
  '-M': { gloss: 'Non-transferable receipt couples — (verifier prefix, signature) pairs receipted by non-transferable identifiers.', spec: CESR_COUNTER },
  '-N': { gloss: 'Transferable receipt indexed-signature groups — an endorser located by (prefix, sequence number, digest) followed by its controller indexed signatures.', spec: CESR_COUNTER },
  '-O': { gloss: 'First-seen replay couples — (first-seen ordinal, datetime) recording when the receiver first saw an event, used for ordered replay.', spec: CESR_COUNTER },
  '-S': { gloss: 'Seal source couples — (sequence number, digest) locating the event that anchors a seal within the same log.', spec: CESR_COUNTER },
  '-T': { gloss: 'Seal source triples — (prefix, sequence number, digest) locating an anchoring event in another identifier’s log.', spec: CESR_COUNTER },
  '-X': { gloss: 'Transferable indexed signature groups — an endorser located by (prefix, sequence number, digest) followed by its controller indexed signatures.', spec: CESR_COUNTER },
  '-Y': { gloss: 'Transferable last indexed signature groups — an endorser located by prefix (using its latest key state) followed by its indexed signatures.', spec: CESR_COUNTER },
  '-_AAA': { gloss: 'CESR genus/version — declares the KERI/ACDC protocol-stack genus and version of the code tables used by the material that follows.', spec: CESR_COUNTER },
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

/** Look up the teaching annotation for a code, or null if it is not annotated (fail-soft). Counter
 * lookups are GENUS-AWARE (decision a7kp2v): the same counter code denotes different groups in CESR
 * v1 vs v2, so `genus` (default 1) selects the v1 or v2 counter table. Primitive (Matter/Indexer)
 * and ilk codes are genus-stable, so `genus` does not affect them. */
export function annotate(category: CodeCategory, code: string, genus = 1): Annotation | null {
  const table = category === 'counter' && genus === 2 ? COUNTER_2 : TABLES[category];
  return table[code] ?? null;
}

// Short glosses for KERI/ACDC message FIELD KEYS, shown in parens beside the terse label so a
// reader need not memorize the single-letter schema. KEL/TEL senses (the common case); a few keys are
// context-dependent (e.g. `s`/`a` differ in ACDCs) — the KEL reading is used here.
// `gloss` is the concise inline label; `find` is the verbatim KERI-spec Title-column text (verified
// against the published spec) that a text fragment targets for precise navigation. Fields with no
// verified Title (dt/rd/ri/r are defined outside this table) link to the section floor, no `find`.
const FIELD: Record<string, Annotation> = {
  v: { gloss: 'version string', spec: `${KERI}#version-string-field`, find: 'MUST be the first field in any top-level KERI field map encoded in JSON' },
  t: { gloss: 'message type', spec: `${KERI}#message-type-field`, find: 'MUST be a three-character string that provides the message type' },
  d: { gloss: 'SAID', spec: `${KERI}#said-fields`, find: 'Some fields in KERI data structures can have a SAID' },
  i: { gloss: 'prefix/AID', spec: `${KERI}#autonomic-identifier-aid`, find: 'The use of a KEL gives rise to an enhanced class of SCIDs that are persistent' },
  s: { gloss: 'sequence number', spec: `${KERI}#sequence-number-field`, find: 'non-negative strictly monotonically increasing integer' },
  p: { gloss: 'prior event digest', spec: `${KERI}#tetrad-bindings`, find: 'Each event after the Inception event also MUST include a cryptographic digest of the previous event' },
  kt: { gloss: 'signing threshold', spec: `${KERI}#key-and-key-digest-threshold-fields`, find: 'any set of M valid signatures from the keys in the list satisfies such a threshold' },
  k: { gloss: 'signing keys', spec: `${KERI}#key-list-field`, find: 'a list of strings that are each a fully qualified public key' },
  nt: { gloss: 'next (rotation) threshold', spec: `${KERI}#key-and-key-digest-threshold-fields`, find: 'Next Key Digest Threshold' },
  n: { gloss: 'next key digests', spec: `${KERI}#pre-rotation`, find: 'is hidden in or blinded by a digest of that key' },
  bt: { gloss: 'witness threshold', spec: `${KERI}#backer-threshold-field`, find: 'This is the number of backers in the backer list that MUST support a key event' },
  b: { gloss: 'witnesses', spec: `${KERI}#indirect-exchange-via-witnesses-and-watchers`, find: 'the direct exchange of key event messages between controller applications' },
  br: { gloss: 'witnesses cut', spec: `${KERI}#backer-remove-list`, find: 'a Backer to be removed from the current Backer list' },
  ba: { gloss: 'witnesses added', spec: `${KERI}#backer-add-list`, find: 'a Backer to be appended to the current Backer list' },
  c: { gloss: 'config traits', spec: `${KERI}#configuration-traits-field`, find: 'Each string represents a configuration trait for the KEL' },
  a: { gloss: 'anchored seals', spec: `${KERI}#seals`, find: 'The dictionary definition of the seal is' },
  di: { gloss: 'delegator prefix', spec: `${KERI}#cooperative-delegation`, find: 'A delegation or identifier delegation operation is provided by a pair of events' },
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
