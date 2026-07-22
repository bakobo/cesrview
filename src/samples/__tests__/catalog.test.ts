import { existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { SAMPLES } from '../catalog';

describe('sample catalog', () => {
  it('lists curated samples, each with a label, a description, and a public/samples file', () => {
    expect(SAMPLES.length).toBeGreaterThan(0);
    for (const s of SAMPLES) {
      expect(s.id).toBeTruthy();
      expect(s.label).toBeTruthy();
      expect(s.description).toBeTruthy();
      expect(s.file).toMatch(/^samples\/[\w.-]+\.cesr$/);
    }
  });

  it('gives every sample a unique id (ids key the list and identify the in-flight load)', () => {
    expect(new Set(SAMPLES.map((s) => s.id)).size).toBe(SAMPLES.length);
  });

  it('tags each sample with a CESR genus and covers both v1 and v2 (the picker groups by it, d4mx9k)', () => {
    for (const s of SAMPLES) expect(s.version).toMatch(/^[12]$/);
    const genera = new Set(SAMPLES.map((s) => s.version));
    expect(genera).toEqual(new Set(['1', '2']));
  });

  it('points every entry at a file that is actually published under public/ (no dead 404s)', () => {
    for (const s of SAMPLES) {
      expect(existsSync(`public/${s.file}`)).toBe(true);
    }
  });
});
