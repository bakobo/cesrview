import { describe, it, expect } from 'vitest';
import { daterToIso } from '../dater';

describe('daterToIso', () => {
  it('decodes a CESR Dater (1AAG) qb64 back to its ISO-8601 datetime', () => {
    // keripy canonical vector: 2020-08-22T17:50:09.988921+00:00
    expect(daterToIso('1AAG2020-08-22T17c50c09d988921p00c00')).toBe(
      '2020-08-22T17:50:09.988921+00:00',
    );
  });

  it('reverses only the CESR substitutions, leaving a negative tz offset intact', () => {
    expect(daterToIso('1AAG2020-08-22T17c50c09d988921-05c00')).toBe(
      '2020-08-22T17:50:09.988921-05:00',
    );
  });

  it('returns null for a non-Dater primitive (wrong code or wrong length)', () => {
    expect(daterToIso('EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2')).toBeNull(); // a SAID
    expect(daterToIso('1AAG2020')).toBeNull(); // right code, wrong length
    expect(daterToIso('')).toBeNull();
  });
});
