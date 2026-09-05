import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { walk } from '../walk';
import { PQ_SIZES, pqSizage } from '../pq';
import type { AttachmentNode, Primitive } from '../types';

/* The post-quantum overlay (decision j2b7dw) and the Falcon exhibit (z9puaw / ja9z4m).
 *
 * The table's own arithmetic is the first oracle: the spec's sizes are internally checkable, so a
 * transcription slip cannot hide. The exhibit is the second: it is real Falcon material, so framing
 * it end to end proves the sizes are right about actual cryptography rather than about themselves. */

/** Every node in an attachment forest, groups and primitives alike. */
const nodes = (n: AttachmentNode): AttachmentNode[] =>
  n.kind === 'group' ? [n, ...n.items.flatMap(nodes)] : [n];

describe('pq — the table is arithmetically self-checking', () => {
  it('carries the 33 post-quantum codes CESR 1.1 defines', () => {
    expect(Object.keys(PQ_SIZES)).toHaveLength(33);
  });

  it('sizes every code consistently with its selector and CESR encoding', () => {
    for (const [code, { fs, ls }] of Object.entries(PQ_SIZES)) {
      // Four-character hard code, no soft part, so the code occupies exactly one quadlet.
      expect(code, `${code}: not a four-character code`).toHaveLength(4);
      // The selector fixes the lead size: `1` -> 0, `2` -> 1, `3` -> 2.
      expect(ls, `${code}: lead size does not match its selector`).toBe(Number(code[0]) - 1);
      // cs % 4 === 0, so the value is whole quadlets and the total is a multiple of 4.
      expect(fs % 4, `${code}: full size ${fs} is not a multiple of 4`).toBe(0);
      // The raw value plus its lead must fill whole 24-bit groups, or it could not be b64-encoded
      // without padding characters — which fixed-length CESR primitives never carry.
      const rawPlusLead = ((fs - 4) * 3) / 4;
      expect(rawPlusLead % 3, `${code}: raw+lead ${rawPlusLead} does not align on 24 bits`).toBe(0);
      expect(rawPlusLead - ls, `${code}: implies a non-positive raw size`).toBeGreaterThan(0);
    }
  });

  it('sizes the Falcon codes to the FN-DSA parameter sets exactly', () => {
    // Independent ground truth: FIPS 206 / the Falcon submission, not the CESR table.
    const raw = (code: string) => {
      const { fs, ls } = PQ_SIZES[code];
      return ((fs - 4) * 3) / 4 - ls;
    };
    expect(raw('1AAQ')).toBe(897); // FN-DSA-512 public key
    expect(raw('1AAR')).toBe(666); // FN-DSA-512 signature, PADDED variant
    expect(raw('2AAA')).toBe(1793); // FN-DSA-1024 public key
    expect(raw('2AAB')).toBe(1280); // FN-DSA-1024 signature
  });

  it('answers only for post-quantum codes', () => {
    expect(pqSizage('1AAQ')).toEqual({ fs: 1200, ls: 0 });
    expect(pqSizage('1AAG')).toBeUndefined(); // a Dater — signify-ts owns this one
    expect(pqSizage('E')).toBeUndefined();
  });
});

describe('pq — framing post-quantum primitives', () => {
  const dir = 'public/samples';
  const exhibit = () => new Uint8Array(readFileSync(`${dir}/falcon-receipt.cesr`));

  it('frames the Falcon exhibit end to end with nothing left over', () => {
    const bytes = exhibit();
    const { messages, errors, consumed } = walk(bytes);
    expect(errors).toEqual([]);
    expect(consumed).toBe(bytes.length); // delta 0
    expect(messages.map((m) => m.ilk)).toEqual(['icp', 'rct']);
  });

  it('decomposes the receipt into a Falcon key and a Falcon signature', () => {
    const bytes = exhibit();
    const rct = walk(bytes).messages[1];
    const group = rct.attachments[0];
    expect(group).toMatchObject({ code: '-C', count: 1, state: 'known' });
    const items = group.items as Primitive[];
    expect(items.map((p) => p.code)).toEqual(['1AAQ', '1AAR']);
    // Spans are byte-exact: the couple tiles the group with no gap and no overhang.
    expect(items[0].span.end - items[0].span.start).toBe(1200);
    expect(items[1].span.end - items[1].span.start).toBe(892);
    expect(items[0].span.start).toBe(group.span.start + 4); // past the -C header
    expect(items[1].span.end).toBe(group.span.end);
  });

  it('never models a post-quantum signature as an INDEXED signature (z9puaw)', () => {
    // The negative requirement of z9puaw, given a positive oracle: CESR 1.1 licenses no indexed
    // post-quantum code, so no part of this exhibit may frame as an Indexer primitive. A comment
    // would not fail if someone later "improved" the sample into a -A controller-signature form.
    const all = walk(exhibit()).messages.flatMap((m) => m.attachments.flatMap(nodes));
    const indexed = all.filter((n) => n.kind === 'primitive' && n.class === 'indexer');
    expect(indexed).toEqual([]);
  });

  it('refuses to resolve a post-quantum code in an INDEXED position (z9puaw)', () => {
    // The same rule at the framing layer rather than in the exhibit: a -A group's members are
    // Indexer primitives, and the overlay must not answer for them however well the code parses.
    const msg = new TextDecoder().decode(exhibit()).slice(0, 253); // the icp, whole
    const { errors } = walk(new TextEncoder().encode(msg + '-AAB' + '1AAR' + 'A'.repeat(888)));
    expect(errors[0]).toMatchObject({ code: 'unframable-group', permanent: true });
  });

  it('reports a truncated post-quantum primitive as incomplete, not malformed (jr9p4w)', () => {
    const bytes = exhibit();
    const { messages, errors } = walk(bytes.slice(0, bytes.length - 40));
    expect(messages).toHaveLength(1); // the icp survives; the receipt waits for its bytes
    expect(errors[0]).toMatchObject({ code: 'incomplete', permanent: false });
  });

  it('rejects a post-quantum primitive whose payload is not base64url', () => {
    const msg = new TextDecoder().decode(exhibit()).slice(0, 253);
    const { errors } = walk(new TextEncoder().encode(msg + '-CAB' + '1AAQ' + '*'.repeat(1196)));
    expect(errors[0]).toMatchObject({ code: 'unframable-group', permanent: true });
  });
});
