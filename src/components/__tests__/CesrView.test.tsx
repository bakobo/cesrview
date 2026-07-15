import { describe, it, expect } from 'vitest';
import { highEntropy } from '../CesrView';

describe('highEntropy', () => {
  it('is true for 44+ char base64url values (AIDs, digests, keys, sigs)', () => {
    expect(highEntropy('EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2')).toBe(true); // 44-char AID
    expect(highEntropy('A'.repeat(88))).toBe(true); // an 88-char signature
  });

  it('is false for short values, thresholds, ilks, and sequence numbers', () => {
    for (const v of ['1/3', 'icp', '0', 'a', '', 'EDP1vHcw']) expect(highEntropy(v)).toBe(false);
  });
});
