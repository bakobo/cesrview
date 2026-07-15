import { existsSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { annotate, DEFERRED_ILKS, type CodeCategory } from '../codes';
import { walk } from '../../cesr/walk';
import type { AttachmentNode } from '../../cesr/types';

const CESR = 'https://trustoverip.github.io/kswg-cesr-specification/';
const KERI = 'https://trustoverip.github.io/kswg-keri-specification/';

describe('annotate — lookup by category (decision x4nb7q)', () => {
  it('annotates a counter/group code with a gloss and the count-code-table anchor', () => {
    const a = annotate('counter', '-A');
    expect(a?.gloss).toMatch(/controller indexed signatures/i);
    expect(a?.spec).toBe(`${CESR}#count-code-tables`);
  });

  it('annotates a Matter primitive code (Blake3 digest)', () => {
    expect(annotate('matter', 'E')?.gloss).toMatch(/blake3/i);
    expect(annotate('matter', 'E')?.spec.startsWith(`${CESR}#master-code-table`)).toBe(true);
  });

  it('resolves the SAME code differently for Matter vs Indexer (d7km3p disambiguation)', () => {
    // 'B' is a non-transferable public key as Matter, a current-only indexed signature as Indexer
    expect(annotate('matter', 'B')?.gloss).toMatch(/public key/i);
    expect(annotate('indexer', 'B')?.gloss).toMatch(/signature/i);
    expect(annotate('matter', 'B')).not.toEqual(annotate('indexer', 'B'));
  });

  it('annotates a KEL ilk with the matching KERI-spec section', () => {
    expect(annotate('ilk', 'icp')?.spec).toBe(`${KERI}#inception-icp`);
    expect(annotate('ilk', 'drt')?.gloss).toMatch(/delegated rotation/i);
  });

  it('returns null for an unannotated code in every category (fail-soft)', () => {
    const categories: CodeCategory[] = ['counter', 'matter', 'indexer', 'ilk'];
    for (const c of categories) expect(annotate(c, 'ZZnot-a-code')).toBeNull();
  });

  it('every annotation points at an allowed spec base over https', () => {
    for (const code of ['-A', '-V', '-0V']) expect(annotate('counter', code)!.spec.startsWith(CESR)).toBe(true);
    for (const code of ['E', 'D', 'B', '0A', '0B', '1AAG']) expect(annotate('matter', code)!.spec.startsWith(CESR)).toBe(true);
    for (const code of ['A', 'B', '2A']) expect(annotate('indexer', code)!.spec.startsWith(CESR)).toBe(true);
    for (const ilk of ['icp', 'rot', 'ixn', 'dip', 'drt', 'rpy', 'exn']) expect(annotate('ilk', ilk)!.spec.startsWith(KERI)).toBe(true);
  });
});

/** Local corpus completeness: every code the real samples carry must be annotated (or an ilk we
 * have explicitly deferred). Auto-skips where the gitignored corpus is absent (e.g. CI). */
describe('annotate — corpus completeness', () => {
  const samples = ['samples/multisig-oobi.cesr', 'samples/credential.cesr'];
  const present = samples.filter((s) => existsSync(s));

  it.skipIf(present.length === 0)('annotates every counter, primitive and KEL ilk in the corpus', () => {
    const counters = new Set<string>();
    const matter = new Set<string>();
    const indexer = new Set<string>();
    const ilks = new Set<string>();
    const scan = (node: AttachmentNode) => {
      if (node.kind === 'group') {
        counters.add(node.code);
        node.items.forEach(scan);
      } else {
        (node.class === 'indexer' ? indexer : matter).add(node.code);
      }
    };
    for (const f of present) {
      const { messages } = walk(new Uint8Array(readFileSync(f)));
      for (const m of messages) {
        if (m.ilk) ilks.add(m.ilk);
        m.attachments.forEach(scan);
      }
    }
    const deferred = new Set<string>(DEFERRED_ILKS);
    const missing: string[] = [];
    counters.forEach((c) => annotate('counter', c) || missing.push(`counter ${c}`));
    matter.forEach((c) => annotate('matter', c) || missing.push(`matter ${c}`));
    indexer.forEach((c) => annotate('indexer', c) || missing.push(`indexer ${c}`));
    ilks.forEach((c) => (annotate('ilk', c) || deferred.has(c)) || missing.push(`ilk ${c}`));
    expect(missing).toEqual([]);
    // and the only unannotated corpus ilks are exactly the deferred TEL set we expect
    const unannotatedIlks = [...ilks].filter((c) => !annotate('ilk', c)).sort();
    expect(unannotatedIlks).toEqual(['iss', 'vcp']);
  });
});
