/* Generate the bundled Falcon exhibit (decisions z9puaw / ja9z4m).
 *
 * Produces a CESR-1 stream holding a classical Ed25519 inception event followed by a receipt of
 * that event whose witness signs with post-quantum Falcon — the PQ transition story in two
 * messages. Everything cryptographic here is REAL: a live FN-DSA-512 keypair, a correctly computed
 * SAID, and a signature over the exact serialized bytes of the receipted event, so the exhibit
 * verifies. Only the setting is synthetic: no KERI implementation can yet issue or receipt with a
 * Falcon key, so the event was hand-built rather than captured from a live witness.
 *
 * Why a receipt couple and not controller signatures: CESR v1.1 defines no INDEXED post-quantum
 * signature code, so a Falcon signature cannot sit in a -A ControllerIdxSigs group. The -C
 * NonTransReceiptCouples group is the only v1 carrier whose members are both plain Matter
 * primitives, which is what a PQ signature has to be (z9puaw).
 *
 * Two facts found while building this, recorded here because this file is committed and the
 * capture-area PROVENANCE.md is not:
 *
 *   - `1AAR`'s 666-byte size is the PADDED Falcon variant. Falcon signatures are natively
 *     variable-length (652 bytes in one sample run), and only falcon512padded yields the fixed 666
 *     the code requires — plain falcon512 produces a signature CESR cannot encode.
 *   - This places a Falcon public KEY (`1AAQ`) in the verfer slot of the couple, where a
 *     non-transferable PREFIX code would normally sit. CESR v1.1 defines no non-transferable-prefix
 *     code for any post-quantum algorithm, only the plain verification key — the same gap as the
 *     missing indexed signature code, one field over. Worth raising with the KSWG; an 897-byte key
 *     would never serve as a prefix in practice anyway.
 *
 * Each run mints a fresh keypair, so the committed sample changes wholesale on regeneration and only
 * its SHAPE is stable — which is what the tests assert.
 *
 * Run: node scripts/make-falcon-sample.mjs
 * Writes: public/samples/falcon-receipt.cesr
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { falcon512padded } from '@noble/post-quantum/falcon.js';
import { ready, Saider } from 'signify-ts';

const OUT = 'public/samples/falcon-receipt.cesr';

/** CESR qb64: a fixed-length code followed by the base64url of its raw value. Every code used here
 * has a raw length that is already a multiple of 3, so no prepad and no '=' ever appear. */
function qb64(code, raw) {
  if (raw.length % 3 !== 0) throw new Error(`${code}: raw length ${raw.length} is not a multiple of 3`);
  return code + Buffer.from(raw).toString('base64url');
}

/** Set a v1 version string's six hex size digits to the serialization's actual byte length. */
function sized(sad) {
  const enc = new TextEncoder();
  const size = enc.encode(JSON.stringify(sad)).length;
  return { ...sad, v: sad.v.replace(/(KERI10JSON)[0-9a-f]{6}_/, `$1${size.toString(16).padStart(6, '0')}_`) };
}

await ready();

// A deterministic Ed25519 non-transferable controller. Its key is a fixed throwaway, never used for
// anything real; the point of the exhibit is the Falcon material attached to its event.
const CTRL = 'BDVHH3ix0_aawmzCf-IBLdRe2UiFGCxEdXFuiecqyLEy';

// 1. The receipted event: an ordinary CESR-1 inception, classical keys, correct SAID. The `d` field
// starts as a 44-character dummy so the version-string size is computed over a serialization the
// same length as the final one — a SAID is exactly as long as the dummy it replaces.
let icp = sized({
  v: 'KERI10JSON000000_',
  t: 'icp',
  d: '#'.repeat(44),
  i: CTRL,
  s: '0',
  kt: '1',
  k: [CTRL],
  nt: '0',
  n: [],
  bt: '0',
  b: [],
  c: [],
  a: [],
});
const [saider] = Saider.saidify(icp);
icp = { ...icp, d: saider.qb64 };
const icpBytes = new TextEncoder().encode(JSON.stringify(icp));

// 2. A post-quantum witness receipts it. The signature is over the receipted event's bytes, which
// is what a KERI receipt signs — not over the receipt message.
const kp = falcon512padded.keygen();
const sig = falcon512padded.sign(icpBytes, kp.secretKey);
if (!falcon512padded.verify(sig, icpBytes, kp.publicKey)) throw new Error('generated signature does not verify');
if (kp.publicKey.length !== 897) throw new Error(`FN-DSA-512 public key is ${kp.publicKey.length} B, expected 897`);
if (sig.length !== 666) throw new Error(`FN-DSA-512 signature is ${sig.length} B, expected 666 (the padded variant)`);

const verfer = qb64('1AAQ', kp.publicKey); // FN-DSA-512 public verification key, 1200 chars
const cigar = qb64('1AAR', sig); // FN-DSA-512 signature, 892 chars

// 3. The receipt message, plus one -C NonTransReceiptCouples group carrying the couple.
const rct = sized({ v: 'KERI10JSON000000_', t: 'rct', d: icp.d, i: icp.i, s: '0' });
const stream = JSON.stringify(icp) + JSON.stringify(rct) + '-CAB' + verfer + cigar;

mkdirSync('public/samples', { recursive: true });
writeFileSync(OUT, stream);

console.log(`wrote ${OUT} — ${stream.length} bytes`);
console.log(`  receipted event  ${icp.d}  (${icpBytes.length} B)`);
console.log(`  FN-DSA-512 key   1AAQ, ${verfer.length} chars over ${kp.publicKey.length} B raw`);
console.log(`  FN-DSA-512 sig   1AAR, ${cigar.length} chars over ${sig.length} B raw`);
console.log(`  signature verifies against the embedded key over the receipted event's bytes`);
