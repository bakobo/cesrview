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

  it('points every entry at a file that is actually published under public/ (no dead 404s)', () => {
    for (const s of SAMPLES) {
      expect(existsSync(`public/${s.file}`)).toBe(true);
    }
  });
});
