/* Post-quantum Primitive size table (decision j2b7dw).
 *
 * CESR v1.1 defines 33 post-quantum Primitive codes; the installed signify-ts (0.4.0) carries none
 * of them, so `Matter.Sizes` misses and every PQ Primitive frames as unframable. This module is the
 * miss-only overlay that fills that gap, and it is the artifact cesrview upstreams. It is CONSULTED
 * ONLY WHEN signify-ts's table does not know a code, so it can never shadow or contradict the
 * delegated tables (@w6ph4k holds for everything else).
 *
 * Ground truth: trustoverip/kswg-cesr-specification, branch v1.1, spec/spec-body.md, the
 * post-quantum rows of the master code table. Every entry is arithmetically self-checking and
 * pq.test.ts proves it: full size is a multiple of 4, lead size follows the selector (`1`->0,
 * `2`->1, `3`->2), and the implied raw size equals the algorithm's NIST parameter set.
 *
 * A PQ Primitive is NOT constructed through signify-ts's Matter — it would throw on the unknown
 * code — so the walker frames it from this table directly. That is sufficient because the walker
 * needs a code and a byte span, never raw bytes, which is why PQ support costs a size table rather
 * than a decoder. When signify-ts ships these codes the miss-only lookup stops firing on its own
 * and this module can be deleted (~7yd5). */

/** The sizing of one fixed-length Primitive: total qb64 length, and lead (prepad) bytes. */
export interface PqSizage {
  fs: number; // full size: the code plus its value, in qb64 characters
  ls: number; // lead size: pad bytes prepended to the raw value so it aligns on 24 bits
}

/** The v1.1 post-quantum codes, keyed by their four-character hard code. */
export const PQ_SIZES: Record<string, PqSizage> = {
  // `1` selector — lead size 0.
  '1AAQ': { fs: 1200, ls: 0 }, // FN-DSA-512 public verification key, 897 B raw (FIPS 206)
  '1AAR': { fs: 892, ls: 0 }, // FN-DSA-512 signature, 666 B raw (FIPS 206)
  '1AAS': { fs: 3460, ls: 0 }, // ML-DSA-87 public verification key, 2592 B raw (FIPS 204)
  '1AAT': { fs: 4416, ls: 0 }, // ML-DSA-65 signature, 3309 B raw (FIPS 204)
  '1AAU': { fs: 68, ls: 0 }, // SLH-DSA-SHA2-192s public verification key, 48 B raw (FIPS 205)
  '1AAV': { fs: 68, ls: 0 }, // SLH-DSA-SHAKE-192s public verification key, 48 B raw (FIPS 205)
  '1AAW': { fs: 21636, ls: 0 }, // SLH-DSA-SHA2-192s signature, 16224 B raw (FIPS 205)
  '1AAX': { fs: 21636, ls: 0 }, // SLH-DSA-SHAKE-192s signature, 16224 B raw (FIPS 205)
  '1AAY': { fs: 68, ls: 0 }, // Seed of SLH-DSA-SHA2-128s private key, 48 B raw (FIPS 205)
  '1AAZ': { fs: 68, ls: 0 }, // Seed of SLH-DSA-SHAKE-128s private key, 48 B raw (FIPS 205)
  '1AAa': { fs: 100, ls: 0 }, // Seed of SLH-DSA-SHA2-192s private key, 72 B raw (FIPS 205)
  '1AAb': { fs: 100, ls: 0 }, // Seed of SLH-DSA-SHAKE-192s private key, 72 B raw (FIPS 205)
  '1AAc': { fs: 132, ls: 0 }, // Seed of SLH-DSA-SHA2-256s private key, 96 B raw (FIPS 205)
  '1AAd': { fs: 132, ls: 0 }, // Seed of SLH-DSA-SHAKE-256s private key, 96 B raw (FIPS 205)
  // `2` selector — lead size 1.
  '2AAA': { fs: 2396, ls: 1 }, // FN-DSA-1024 public verification key, 1793 B raw (FIPS 206)
  '2AAB': { fs: 1712, ls: 1 }, // FN-DSA-1024 signature, 1280 B raw (FIPS 206)
  '2AAC': { fs: 48, ls: 1 }, // Seed of FN-DSA-512 private key, 32 B raw (FIPS 206)
  '2AAD': { fs: 48, ls: 1 }, // Seed of FN-DSA-1024 private key, 32 B raw (FIPS 206)
  '2AAE': { fs: 2608, ls: 1 }, // ML-DSA-65 public verification key, 1952 B raw (FIPS 204)
  '2AAF': { fs: 3232, ls: 1 }, // ML-DSA-44 signature, 2420 B raw (FIPS 204)
  '2AAG': { fs: 48, ls: 1 }, // Seed of ML-DSA-44 private key, 32 B raw (FIPS 204)
  '2AAH': { fs: 48, ls: 1 }, // Seed of ML-DSA-65 private key, 32 B raw (FIPS 204)
  '2AAI': { fs: 48, ls: 1 }, // Seed of ML-DSA-87 private key, 32 B raw (FIPS 204)
  '2AAJ': { fs: 48, ls: 1 }, // SLH-DSA-SHA2-128s public verification key, 32 B raw (FIPS 205)
  '2AAK': { fs: 48, ls: 1 }, // SLH-DSA-SHAKE-128s public verification key, 32 B raw (FIPS 205)
  '2AAL': { fs: 10480, ls: 1 }, // SLH-DSA-SHA2-128s signature, 7856 B raw (FIPS 205)
  '2AAM': { fs: 10480, ls: 1 }, // SLH-DSA-SHAKE-128s signature, 7856 B raw (FIPS 205)
  '2AAN': { fs: 39728, ls: 1 }, // SLH-DSA-SHA2-256s signature, 29792 B raw (FIPS 205)
  '2AAO': { fs: 39728, ls: 1 }, // SLH-DSA-SHAKE-256s signature, 29792 B raw (FIPS 205)
  // `3` selector — lead size 2.
  '3AAA': { fs: 1756, ls: 2 }, // ML-DSA-44 public verification key, 1312 B raw (FIPS 204)
  '3AAB': { fs: 6176, ls: 2 }, // ML-DSA-87 signature, 4627 B raw (FIPS 204)
  '3AAC': { fs: 92, ls: 2 }, // SLH-DSA-SHA2-256s public verification key, 64 B raw (FIPS 205)
  '3AAD': { fs: 92, ls: 2 }, // SLH-DSA-SHAKE-256s public verification key, 64 B raw (FIPS 205)
};

/** The sizing for a post-quantum code, or undefined if it is not one. Callers use this only after
 * signify-ts's own table has missed, so a code present in both resolves through signify-ts. */
export const pqSizage = (code: string): PqSizage | undefined => PQ_SIZES[code];
