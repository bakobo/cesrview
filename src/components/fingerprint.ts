/* Deterministic identity helpers for high-entropy values (decision d4nk7v). The fingerprint GLYPH is
 * the primary sameness cue (v7kd3m: pattern, not colour); the colour bucket is a secondary CVD-safe
 * category only. A cesrview-owned stand-in until the enhanced entviz pill is integrated (~2o7m). */

/** FNV-1a hash of a string, as an unsigned 32-bit integer. */
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** A deterministic, horizontally symmetric bit grid identifying a value — the identity glyph. Same
 * value always yields the same pattern, which is what carries sameness (v7kd3m). */
export function fingerprint(value: string, cells = 5): boolean[][] {
  const half = Math.ceil(cells / 2);
  let x = hash(value);
  const nextBit = (): boolean => {
    x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0;
    return (x & 1) === 1;
  };
  const grid: boolean[][] = [];
  for (let r = 0; r < cells; r++) {
    const row = new Array<boolean>(cells).fill(false);
    for (let c = 0; c < half; c++) {
      const on = nextBit();
      row[c] = on;
      row[cells - 1 - c] = on; // mirror horizontally (identicon-style)
    }
    grid.push(row);
  }
  return grid;
}

/** A deterministic categorical colour bucket (0..count-1) — a secondary, CVD-safe cue, never the
 * sole carrier of identity (v7kd3m). */
export function colorBucket(value: string, count = 8): number {
  return hash(value) % count;
}

/** Compact display form of a long value: first 8 … last 3. Short values are returned unchanged. */
export function shorten(value: string): string {
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-3)}` : value;
}

/** A short role label for a primitive, from its code and table (decoration for the pill). */
export function roleOfPrimitive(code: string, cls: 'matter' | 'indexer'): string {
  if (cls === 'indexer') return 'sig';
  if (code === 'E') return 'digest';
  if (code === 'D' || code === 'B') return 'key';
  return 'id';
}
