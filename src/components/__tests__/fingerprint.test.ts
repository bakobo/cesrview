import { describe, it, expect } from 'vitest';
import { fingerprint, colorBucket, shorten, roleOfPrimitive } from '../fingerprint';

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2';

describe('fingerprint', () => {
  it('is deterministic for the same value', () => {
    expect(fingerprint(AID)).toEqual(fingerprint(AID));
  });

  it('is a horizontally symmetric 5x5 grid', () => {
    const grid = fingerprint(AID);
    expect(grid).toHaveLength(5);
    for (const row of grid) {
      expect(row).toHaveLength(5);
      expect(row[0]).toBe(row[4]);
      expect(row[1]).toBe(row[3]);
    }
  });

  it('differs for different values', () => {
    expect(fingerprint('A'.repeat(44))).not.toEqual(fingerprint('B'.repeat(44)));
  });
});

describe('colorBucket', () => {
  it('is deterministic and within range', () => {
    expect(colorBucket(AID)).toBe(colorBucket(AID));
    expect(colorBucket(AID)).toBeGreaterThanOrEqual(0);
    expect(colorBucket(AID)).toBeLessThan(8);
  });
});

describe('shorten', () => {
  it('truncates long values and leaves short ones unchanged', () => {
    expect(shorten(AID)).toBe('EDP1vHcw…PC2');
    expect(shorten('icp')).toBe('icp');
  });
});

describe('roleOfPrimitive', () => {
  it('labels indexer sigs, digests, keys, and everything else', () => {
    expect(roleOfPrimitive('A', 'indexer')).toBe('sig');
    expect(roleOfPrimitive('E', 'matter')).toBe('digest');
    expect(roleOfPrimitive('D', 'matter')).toBe('key');
    expect(roleOfPrimitive('B', 'matter')).toBe('key');
    expect(roleOfPrimitive('0A', 'matter')).toBe('id');
  });
});
