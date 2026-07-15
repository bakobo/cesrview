import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { walk, parseVersion } from '../walk';

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

describe('walk — synthetic structure', () => {
  it('frames a message with no attachments', () => {
    const { messages, errors, consumed } = walk(bytesOf(mkMessage({ t: 'ixn', s: '1', d: 'E_' })));
    expect(errors).toEqual([]);
    expect(messages).toHaveLength(1);
    expect(messages[0].attachments).toEqual([]);
    expect(consumed).toBe(messages[0].span.end);
  });

  it('frames a -V quadlet attachment group by count*4 (opaque items for now)', () => {
    const stream = bytesOf(mkMessage({ t: 'ixn' }) + '-VAB' + 'AAAA'); // count 1 -> 4 bytes
    const { messages, errors, consumed } = walk(stream);
    expect(errors).toEqual([]);
    expect(consumed).toBe(stream.length);
    expect(messages[0].attachments).toEqual([
      {
        kind: 'group',
        code: '-V',
        count: 1,
        span: { start: messages[0].span.end, end: stream.length },
        state: 'known',
        items: [],
      },
    ]);
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
    const stream = bytesOf(msg + '-CAB'); // -C is a known code we do not yet frame
    const { messages, errors, consumed } = walk(stream);
    expect(messages).toHaveLength(1);
    expect(messages[0].attachments[0]).toMatchObject({ code: '-C', state: 'unknown' });
    expect(errors[0].message).toMatch(/cannot frame counter -C/);
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
