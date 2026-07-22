import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { prettyPrint } from '../prettyprint';
import { walk } from '../walk';
import type { AttachmentGroup, CesrMessage, Primitive, WalkResult } from '../types';

const bytes = new TextEncoder().encode('SIGVALUEHERE'); // primitive 'SIGVALUE' at [0, 8)
const prim: Primitive = { kind: 'primitive', code: 'A', class: 'indexer', span: { start: 0, end: 8 } };
const aGroup: AttachmentGroup = { kind: 'group', code: '-A', count: 1, genus: 1, state: 'known', span: { start: 0, end: 8 }, items: [prim] };
const vGroup: AttachmentGroup = { kind: 'group', code: '-V', count: 1, genus: 1, state: 'known', span: { start: 0, end: 12 }, items: [aGroup] };
const msg = (over: Partial<CesrMessage> = {}): CesrMessage => ({
  proto: 'KERI',
  version: '1.0',
  kind: 'JSON',
  ilk: 'icp',
  sn: '0',
  said: 'E1',
  sad: { t: 'icp', s: '0' },
  span: { start: 0, end: 20 },
  attachments: [],
  ...over,
});
const result = (over: Partial<WalkResult> = {}): WalkResult => ({ messages: [], errors: [], consumed: 0, ...over });

describe('prettyPrint', () => {
  it('renders a JSON body as indented lines, each mapped to the body span', () => {
    const doc = prettyPrint(result({ messages: [msg()] }), bytes);
    expect(doc.text).toContain('"t": "icp"');
    expect(doc.lines.every((l) => l.span?.start === 0 && l.span?.end === 20)).toBe(true);
    expect(doc.lines.length).toBeGreaterThan(1); // one line per field, not one blob
  });

  it('renders attachment group and primitive lines with their fine byte spans', () => {
    const doc = prettyPrint(result({ messages: [msg({ sad: null, attachments: [aGroup] })] }), bytes);
    const texts = doc.lines.map((l) => l.text);
    expect(texts.some((t) => t.includes('-A ×1'))).toBe(true);
    const primLine = doc.lines.find((l) => l.text.includes('SIGVALUE'));
    expect(primLine?.span).toEqual({ start: 0, end: 8 });
  });

  it('indents nested groups', () => {
    const doc = prettyPrint(result({ messages: [msg({ sad: null, attachments: [vGroup] })] }), bytes);
    const texts = doc.lines.map((l) => l.text);
    expect(texts).toContain('-V ×1');
    expect(texts).toContain('  -A ×1'); // nested one level in
  });

  it('renders a frame-only (sad null) body as an undecoded placeholder with the body span', () => {
    const doc = prettyPrint(result({ messages: [msg({ sad: null, kind: 'CBOR' })] }), bytes);
    expect(doc.lines[0].text).toMatch(/undecoded/i);
    expect(doc.lines[0].span).toEqual({ start: 0, end: 20 });
  });

  it('renders a line per parse error', () => {
    const doc = prettyPrint(
      result({ errors: [{ code: 'no-version-string', message: 'No CESR version string at byte 3.', span: { start: 3, end: 7 }, permanent: true }] }),
      bytes,
    );
    expect(doc.lines.some((l) => l.text.includes('No CESR version string'))).toBe(true);
  });

  it('joins the line texts into the document text', () => {
    const doc = prettyPrint(result({ messages: [msg()] }), bytes);
    expect(doc.text).toBe(doc.lines.map((l) => l.text).join('\n'));
  });

  it('pretty-prints a real walked stream', () => {
    const b = new Uint8Array(readFileSync('src/cesr/__tests__/fixtures/tiny-piped-kel.cesr'));
    const doc = prettyPrint(walk(b), b);
    expect(doc.lines.length).toBeGreaterThan(4);
    expect(doc.text).toContain('"t": "icp"');
    expect(doc.text).toContain('-V ×');
  });
});
