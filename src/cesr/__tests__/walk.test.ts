import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { walk, parseVersion } from '../walk';
import type { AttachmentGroup, AttachmentNode } from '../types';

/** Narrow an attachment node to a group for nested-item assertions (tests build valid groups). */
const asGroup = (n: AttachmentNode) => n as AttachmentGroup;

const SAID = 'ELXXiPwoaWOVOTLMOAmg4IKkjFHFs3q2hsL9tHvuuC2D'; // 44-char Blake3 digest (Matter 'E')
const SEQNER = '0A' + 'A'.repeat(22); // 24-char Number/Seqner primitive (sn 0)
const G_GROUP = '-GAB' + SEQNER + SAID; // one -G seal-source-couple = 72 bytes (18 quadlets)

// Throwaway primitives from keripy, for the compound trans-sig/receipt groups (t6nv4q).
const SIG = 'AACMeIMNXpYbryJsyq2VCJsFl1trtbhBMUetIKvC9aft4uI_bMFz0YvTNA2w-PAgkzMfXeV8tzeyWVr7SBlkmZoC'; // 88-char indexed Siger
const DAT = '1AAG2020-08-22T17c50c09d988921p00c00'; // 36-char Dater (datetime)
const VER = 'DDVHH3ix0_aawmzCf-IBLdRe2UiFGCxEdXFuiecqyLEy'; // 44-char Verfer (Ed25519 public key)
const CIG = '0BCMeIMNXpYbryJsyq2VCJsFl1trtbhBMUetIKvC9aft4uI_bMFz0YvTNA2w-PAgkzMfXeV8tzeyWVr7SBlkmZoC'; // 88-char non-indexed Cigar
const A_GROUP = '-AAB' + SIG; // one -A ControllerIdxSigs group (count 1) = 92 bytes

/** Build a self-framed v1 message with a correct version-string size, for synthetic edge cases. */
function mkMessage(fields: Record<string, unknown>, proto = 'KERI'): string {
  const enc = new TextEncoder();
  const withPlaceholder = JSON.stringify({ v: `${proto}10JSON000000_`, ...fields });
  const size = enc.encode(withPlaceholder).length;
  return withPlaceholder.replace(
    `${proto}10JSON000000_`,
    `${proto}10JSON${size.toString(16).padStart(6, '0')}_`,
  );
}
const bytesOf = (s: string) => new TextEncoder().encode(s);

describe('parseVersion', () => {
  it('reads proto, version, kind and size from a v1 version string', () => {
    const v = parseVersion(bytesOf(mkMessage({ t: 'ixn' })), 0);
    expect(v).toEqual({ proto: 'KERI', version: '1.0', kind: 'JSON', size: expect.any(Number) });
  });

  it('returns null when there is no version string', () => {
    expect(parseVersion(bytesOf('{"x":1}'), 0)).toBeNull();
  });
});

describe('walk — real (keripy-generated) fixture', () => {
  const dir = 'src/cesr/__tests__/fixtures';
  const stream = new Uint8Array(readFileSync(`${dir}/tiny-kel.cesr`));
  const golden = JSON.parse(readFileSync(`${dir}/tiny-kel.golden.json`, 'utf8'));

  it('frames every message with byte-exact spans, matching the keripy oracle', () => {
    const { messages, errors, consumed } = walk(stream);
    expect(errors).toEqual([]);
    expect(consumed).toBe(stream.length); // delta 0 — no {-sniffing
    expect(messages).toHaveLength(golden.messages.length);
    messages.forEach((m, k) => {
      const g = golden.messages[k];
      expect(m.ilk).toBe(g.ilk);
      expect(m.sn).toBe(g.sn);
      expect(m.said).toBe(g.said);
      expect(m.span).toEqual({ start: g.attachStart - g.size, end: g.attachStart });
      expect(m.attachments.map((a) => ({ code: a.code, count: a.count }))).toEqual(g.groups);
      expect(m.attachments.every((a) => a.state === 'known')).toBe(true);
    });
  });
});

describe('walk — pipelined (-V-wrapped) keripy oracle fixture (z4pm7k)', () => {
  const dir = 'src/cesr/__tests__/fixtures';
  const stream = new Uint8Array(readFileSync(`${dir}/tiny-piped-kel.cesr`));
  const golden = JSON.parse(readFileSync(`${dir}/tiny-piped-kel.golden.json`, 'utf8'));

  it('frames every pipelined message and decomposes each -V into its typed inner groups', () => {
    const { messages, errors, consumed } = walk(stream);
    expect(errors).toEqual([]);
    expect(consumed).toBe(stream.length); // byte-exact against keripy's serializer
    expect(messages).toHaveLength(golden.messages.length);
    messages.forEach((m, k) => {
      const g = golden.messages[k];
      expect(m.ilk).toBe(g.ilk);
      expect(m.sn).toBe(g.sn);
      expect(m.said).toBe(g.said); // SAID computed by keripy, reproduced by the walker
      expect(m.span).toEqual({ start: g.bodyStart, end: g.bodyStart + g.size });
      expect(m.attachments).toHaveLength(1);
      const v = m.attachments[0];
      expect(v).toMatchObject({ code: '-V', state: 'known' });
      expect(v.items.map((it) => asGroup(it).code)).toEqual(g.innerGroups);
      expect(v.span.start).toBe(g.bodyStart + g.size);
      // every inner group sits within the wrapper's byte span
      v.items.forEach((it) => {
        expect(it.span.start).toBeGreaterThanOrEqual(v.span.start);
        expect(it.span.end).toBeLessThanOrEqual(v.span.end);
      });
    });
  });
});

describe('walk — -V/-0V inner decomposition (decision z4pm7k)', () => {
  const attach = (payload: string) => bytesOf(mkMessage({ t: 'ixn' }) + payload);

  it('decomposes a -V wrapper into its typed inner group and primitives', () => {
    const stream = attach('-VAS' + G_GROUP); // 72 inner bytes = 18 quadlets
    const { messages, errors, consumed } = walk(stream);
    expect(errors).toEqual([]);
    expect(consumed).toBe(stream.length);
    const v = messages[0].attachments[0];
    expect(v).toMatchObject({
      kind: 'group',
      code: '-V',
      count: 18,
      state: 'known',
      span: { start: messages[0].span.end, end: stream.length },
      items: [
        {
          kind: 'group',
          code: '-G',
          count: 1,
          state: 'known',
          items: [{ kind: 'primitive' }, { kind: 'primitive' }],
        },
      ],
    });
    // the inner group is byte-exact: it begins right after the 4-byte -V header
    expect(asGroup(v.items[0]).span).toEqual({ start: messages[0].span.end + 4, end: stream.length });
  });

  it('decomposes a -V wrapper carrying two inner groups', () => {
    const stream = attach('-VAk' + G_GROUP + G_GROUP); // 144 inner bytes = 36 quadlets
    const { messages, errors } = walk(stream);
    expect(errors).toEqual([]);
    const v = messages[0].attachments[0];
    expect(v.state).toBe('known');
    expect(v.items.map((it) => asGroup(it).code)).toEqual(['-G', '-G']);
  });

  it('decomposes a -0V big wrapper the same way as -V', () => {
    const stream = attach('-0VAAAAS' + G_GROUP); // 8-byte header, 18 quadlets
    const { messages, errors } = walk(stream);
    expect(errors).toEqual([]);
    const v = messages[0].attachments[0];
    expect(v).toMatchObject({ code: '-0V', count: 18, state: 'known' });
    expect(asGroup(v.items[0])).toMatchObject({ code: '-G', state: 'known' });
  });

  it('recurses nested -V wrappers', () => {
    const inner = '-VAS' + G_GROUP; // 76 bytes = 19 quadlets
    const stream = attach('-VAT' + inner);
    const { messages, errors } = walk(stream);
    expect(errors).toEqual([]);
    const outer = messages[0].attachments[0];
    expect(outer).toMatchObject({ code: '-V', state: 'known' });
    const mid = asGroup(outer.items[0]);
    expect(mid).toMatchObject({ code: '-V', state: 'known' });
    expect(asGroup(mid.items[0]).code).toBe('-G');
  });

  it('leaves -L (pathed material) opaque, not recursed (tick ~3cep)', () => {
    const stream = attach('-LAB' + 'AAAA'); // count 1 -> 4 opaque bytes
    const { messages, errors } = walk(stream);
    expect(errors).toEqual([]);
    expect(messages[0].attachments[0]).toMatchObject({ code: '-L', state: 'known', items: [] });
  });

  it('treats a -V as a resilience boundary: an unparseable inner counter does not halt the walk (p3wk7n)', () => {
    const msg2 = mkMessage({ t: 'ixn', s: '2' });
    const stream = bytesOf(mkMessage({ t: 'ixn' }) + '-VAB' + '-ZAB' + msg2); // -Z unsupported, inside -V
    const { messages, errors, consumed } = walk(stream);
    expect(errors).toEqual([]); // the wrapper's known size absorbs the undecodable inner content
    expect(messages).toHaveLength(2); // the walk resumes past the wrapper and reaches msg2
    expect(messages[0].attachments[0]).toMatchObject({ code: '-V', state: 'known', items: [] });
    expect(consumed).toBe(stream.length);
  });

  it('leaves a recognized-but-unmodelled inner counter as an unknown child, without halting (tick ~4ptb)', () => {
    const msg2 = mkMessage({ t: 'ixn', s: '2' });
    const stream = bytesOf(mkMessage({ t: 'ixn' }) + '-VAB' + '-JAB' + msg2); // -J: known counter, unframed
    const { messages, errors } = walk(stream);
    expect(errors).toEqual([]);
    expect(messages).toHaveLength(2);
    const v = messages[0].attachments[0];
    expect(v).toMatchObject({ code: '-V', state: 'known' });
    expect(asGroup(v.items[0])).toMatchObject({ code: '-J', state: 'unknown' });
  });

  it('stops decomposing a -V when inner content underfills it, keeping the wrapper and continuing', () => {
    const msg2 = mkMessage({ t: 'ixn', s: '2' });
    const stream = bytesOf(mkMessage({ t: 'ixn' }) + '-VAT' + G_GROUP + 'AAAA' + msg2); // group + 4 filler
    const { messages, errors } = walk(stream);
    expect(errors).toEqual([]);
    expect(messages).toHaveLength(2);
    const v = messages[0].attachments[0];
    expect(v).toMatchObject({ code: '-V', state: 'known' });
    expect(asGroup(v.items[0]).code).toBe('-G'); // decoded up to the filler, then stopped
  });
});

describe('walk — compound trans-sig and receipt groups (decision t6nv4q)', () => {
  const attach = (payload: string) => bytesOf(mkMessage({ t: 'ixn' }) + payload);

  it('frames a -F TransIdxSigGroups: prefixer, seqner, saider, then a nested -A group', () => {
    const stream = attach('-FAB' + SAID + SEQNER + SAID + A_GROUP);
    const { messages, errors, consumed } = walk(stream);
    expect(errors).toEqual([]);
    expect(consumed).toBe(stream.length);
    const f = messages[0].attachments[0];
    expect(f).toMatchObject({ code: '-F', count: 1, state: 'known' });
    expect(f.items.map((it) => it.kind)).toEqual(['primitive', 'primitive', 'primitive', 'group']);
    const nested = asGroup(f.items[3]);
    expect(nested).toMatchObject({ code: '-A', state: 'known' });
    expect(nested.items).toHaveLength(1); // one indexed sig
  });

  it('frames a -H TransLastIdxSigGroups: prefixer, then a nested -A group', () => {
    const stream = attach('-HAB' + SAID + A_GROUP);
    const { messages, errors } = walk(stream);
    expect(errors).toEqual([]);
    const h = messages[0].attachments[0];
    expect(h).toMatchObject({ code: '-H', count: 1, state: 'known' });
    expect(h.items.map((it) => it.kind)).toEqual(['primitive', 'group']);
    expect(asGroup(h.items[1])).toMatchObject({ code: '-A', state: 'known' });
  });

  it('frames a -D TransReceiptQuadruples of (prefixer, seqner, saider, siger)', () => {
    const stream = attach('-DAB' + SAID + SEQNER + SAID + SIG);
    const { messages, errors, consumed } = walk(stream);
    expect(errors).toEqual([]);
    expect(consumed).toBe(stream.length);
    const d = messages[0].attachments[0];
    expect(d).toMatchObject({ code: '-D', count: 1, state: 'known' });
    expect(d.items).toHaveLength(4);
    expect(d.items.every((it) => it.kind === 'primitive')).toBe(true);
  });

  it('frames a -E FirstSeenReplayCouples of (seqner, dater)', () => {
    const stream = attach('-EAB' + SEQNER + DAT);
    const { messages, errors } = walk(stream);
    expect(errors).toEqual([]);
    const e = messages[0].attachments[0];
    expect(e).toMatchObject({ code: '-E', count: 1, state: 'known' });
    expect(e.items).toHaveLength(2);
  });

  it('frames a -C NonTransReceiptCouples of (verfer, cigar)', () => {
    const stream = attach('-CAB' + VER + CIG);
    const { messages, errors, consumed } = walk(stream);
    expect(errors).toEqual([]);
    expect(consumed).toBe(stream.length);
    const c = messages[0].attachments[0];
    expect(c).toMatchObject({ code: '-C', count: 1, state: 'known' });
    expect(c.items).toHaveLength(2);
  });

  it('marks a -F invalid when its nested -A group is malformed', () => {
    const stream = attach('-FAB' + SAID + SEQNER + SAID + '-AAB' + '####'); // bad sig in nested -A
    const { messages, errors } = walk(stream);
    expect(messages[0].attachments[0]).toMatchObject({ code: '-F', state: 'invalid' });
    expect(errors[0].message).toMatch(/cannot frame counter -F/);
  });
});

describe('walk — compound -F keripy oracle fixture (t6nv4q)', () => {
  const dir = 'src/cesr/__tests__/fixtures';
  const stream = new Uint8Array(readFileSync(`${dir}/tiny-endorsed.cesr`));
  const golden = JSON.parse(readFileSync(`${dir}/tiny-endorsed.golden.json`, 'utf8'));

  it('decomposes a real seal-endorsed message: -V wrapping a -F with a nested -A', () => {
    const { messages, errors, consumed } = walk(stream);
    expect(errors).toEqual([]);
    expect(consumed).toBe(stream.length);
    expect(messages).toHaveLength(1);
    const m = messages[0];
    expect(m.said).toBe(golden.said);
    const v = m.attachments[0];
    expect(v).toMatchObject({ code: '-V', state: 'known' });
    expect(v.items.map((it) => asGroup(it).code)).toEqual(golden.innerGroups); // ['-F']
    const f = asGroup(v.items[0]);
    expect(f).toMatchObject({ code: '-F', state: 'known' });
    // the -F item: three primitives then a nested -A group
    expect(f.items.map((it) => (it.kind === 'group' ? asGroup(it).code : 'primitive'))).toEqual(golden.fParts);
  });
});

describe('walk — synthetic structure', () => {
  it('frames a message with no attachments', () => {
    const { messages, errors, consumed } = walk(bytesOf(mkMessage({ t: 'ixn', s: '1', d: 'E_' })));
    expect(errors).toEqual([]);
    expect(messages).toHaveLength(1);
    expect(messages[0].attachments).toEqual([]);
    expect(consumed).toBe(messages[0].span.end);
  });

  it('frames an -I seal-source-triple group into typed (i, s, d) primitives', () => {
    const said = 'ELXXiPwoaWOVOTLMOAmg4IKkjFHFs3q2hsL9tHvuuC2D'; // real 44-char Blake3 digest
    const seqner = '0A' + 'A'.repeat(22); // sn 0, a 24-char Number/Seqner primitive
    const iGroup = '-IAB' + said + seqner + said; // count 1: prefixer, seqner, saider
    const stream = bytesOf(mkMessage({ t: 'ixn' }) + iGroup);
    const { messages, errors, consumed } = walk(stream);
    expect(errors).toEqual([]);
    expect(consumed).toBe(stream.length);
    const group = messages[0].attachments[0];
    expect(group).toMatchObject({ kind: 'group', code: '-I', count: 1, state: 'known' });
    expect(group.items).toEqual([
      { kind: 'primitive', code: 'E', span: expect.any(Object) },
      { kind: 'primitive', code: '0A', span: expect.any(Object) },
      { kind: 'primitive', code: 'E', span: expect.any(Object) },
    ]);
  });

  it('frames a -G seal-source-couple group into (s, d) primitives', () => {
    const said = 'ELXXiPwoaWOVOTLMOAmg4IKkjFHFs3q2hsL9tHvuuC2D';
    const seqner = '0A' + 'A'.repeat(22);
    const stream = bytesOf(mkMessage({ t: 'ixn' }) + '-GAB' + seqner + said);
    const { messages, errors } = walk(stream);
    expect(errors).toEqual([]);
    expect(messages[0].attachments[0]).toMatchObject({ code: '-G', count: 1, state: 'known' });
    expect(messages[0].attachments[0].items).toHaveLength(2);
  });

  it('nulls ilk, sn and said when the fields are absent (e.g. an ACDC)', () => {
    const { messages } = walk(bytesOf(mkMessage({ i: 'E_holder' }, 'ACDC')));
    expect(messages[0]).toMatchObject({ ilk: null, sn: null, said: null, proto: 'ACDC' });
  });
});

describe('walk — resilience (decision d3rk6n)', () => {
  it('errors and stops when the stream does not start with a message', () => {
    const { messages, errors, consumed } = walk(bytesOf('garbage'));
    expect(messages).toEqual([]);
    expect(consumed).toBe(0);
    expect(errors[0].message).toMatch(/expected a message at byte 0/);
  });

  it('errors when a { has no version string', () => {
    const { errors } = walk(bytesOf('{"x":1}'));
    expect(errors[0].message).toMatch(/no version string/);
  });

  it('errors on a malformed message body', () => {
    // version claims 32 bytes but the body is not valid JSON
    const stream = bytesOf('{"v":"KERI10JSON000020_"XXXXXXXX');
    const { messages, errors } = walk(stream);
    expect(messages).toEqual([]);
    expect(errors[0].message).toMatch(/malformed message body/);
  });

  it('keeps the message but marks an unrecognized (unframable) counter and stops', () => {
    const msg = mkMessage({ t: 'ixn' });
    const stream = bytesOf(msg + '-JAB'); // -J SadPathSig: a known code we do not yet frame (~4ptb)
    const { messages, errors, consumed } = walk(stream);
    expect(messages).toHaveLength(1);
    expect(messages[0].attachments[0]).toMatchObject({ code: '-J', state: 'unknown' });
    expect(errors[0].message).toMatch(/cannot frame counter -J/);
    expect(consumed).toBeLessThan(stream.length);
  });

  it('reports an unparseable counter code', () => {
    const stream = bytesOf(mkMessage({ t: 'ixn' }) + '-ZAB'); // -Z: unsupported code
    const { errors } = walk(stream);
    expect(errors[0].message).toMatch(/unparseable counter/);
  });

  it('marks an indexed-sig group invalid when an item is malformed', () => {
    const stream = bytesOf(mkMessage({ t: 'ixn' }) + '-AAB' + '####'); // count 1, garbage item
    const { messages, errors } = walk(stream);
    expect(messages[0].attachments[0]).toMatchObject({ code: '-A', state: 'invalid' });
    expect(errors[0].message).toMatch(/cannot frame counter -A/);
  });

  it('marks a primitive group invalid when a primitive item is malformed', () => {
    const said = 'ELXXiPwoaWOVOTLMOAmg4IKkjFHFs3q2hsL9tHvuuC2D';
    const stream = bytesOf(mkMessage({ t: 'ixn' }) + '-IAB' + said + '####'); // 2nd part unparseable
    const { messages, errors } = walk(stream);
    const group = messages[0].attachments[0];
    expect(group).toMatchObject({ code: '-I', state: 'invalid' });
    expect(group.items).toHaveLength(1); // only the first primitive framed
    expect(errors[0].message).toMatch(/cannot frame counter -I/);
  });
});
