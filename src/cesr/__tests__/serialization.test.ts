import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { walk } from '../walk';
import { serializationDecoders } from '../decoders';
import type { BodyDecoder } from '../types';

const dir = 'src/cesr/__tests__/fixtures';
const load = (name: string) => new Uint8Array(readFileSync(`${dir}/${name}.cesr`));
const gold = (name: string) => JSON.parse(readFileSync(`${dir}/${name}.golden.json`, 'utf8'));

describe('walk — CBOR/MGPK bodies via pluggable decoders (decision s7bk4m)', () => {
  for (const [kind, fix] of [
    ['CBOR', 'tiny-kel-cbor'],
    ['MGPK', 'tiny-kel-mgpk'],
  ] as const) {
    const stream = load(fix);
    const golden = gold(fix);

    it(`frames a ${kind} stream to delta 0 without a decoder, leaving bodies undecoded`, () => {
      const { messages, errors, consumed } = walk(stream);
      expect(errors).toEqual([]);
      expect(consumed).toBe(stream.length); // framed by the version-string size, no body decode needed
      expect(messages).toHaveLength(golden.messages.length);
      messages.forEach((m, k) => {
        const g = golden.messages[k];
        expect(m.kind).toBe(kind);
        expect(m.sad).toBeNull(); // frame-only: the body is not decoded
        expect(m.ilk).toBeNull();
        expect(m.sn).toBeNull();
        expect(m.said).toBeNull();
        expect(m.span).toEqual({ start: g.bodyStart, end: g.bodyStart + g.size });
        expect(m.attachments[0]).toMatchObject({ code: '-A', state: 'known' }); // attachments still frame
      });
    });

    it(`fully decodes a ${kind} stream when the decoder is injected`, () => {
      const { messages, errors, consumed } = walk(stream, { decoders: serializationDecoders });
      expect(errors).toEqual([]);
      expect(consumed).toBe(stream.length);
      messages.forEach((m, k) => {
        const g = golden.messages[k];
        expect(m.kind).toBe(kind);
        expect(m.ilk).toBe(g.ilk);
        expect(m.sn).toBe(g.sn);
        expect(m.said).toBe(g.said); // keripy-recomputed SAID, reproduced from the decoded body
        expect(m.sad?.t).toBe(g.ilk);
      });
    });
  }

  it('still decodes JSON with the built-in decoder, with or without injected decoders', () => {
    const stream = load('tiny-kel');
    const golden = gold('tiny-kel');
    for (const opts of [undefined, { decoders: serializationDecoders }]) {
      const { messages, errors } = walk(stream, opts);
      expect(errors).toEqual([]);
      expect(messages[0].ilk).toBe(golden.messages[0].ilk);
      expect(messages[0].sad).not.toBeNull();
    }
  });

  it('reports malformed-body when an injected decoder throws on the body', () => {
    const throwing: Record<string, BodyDecoder> = {
      CBOR: () => {
        throw new Error('bad bytes');
      },
    };
    const { errors } = walk(load('tiny-kel-cbor'), { decoders: throwing });
    expect(errors[0]).toMatchObject({ code: 'malformed-body', permanent: true });
  });
});
