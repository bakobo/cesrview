import { existsSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { walk } from '../walk';
import type { AttachmentGroup, AttachmentNode } from '../types';

/* Local corpus regression guard. Runs the walker over the real (gitignored, synthetic PII-free)
 * samples and locks the framing invariants that every increment must preserve: delta-0 framing,
 * zero errors, exact wrapper tiling, and — for these fully-modelled samples — zero unknown/invalid
 * nodes. Auto-skips where the corpus is absent (CI, fresh clones); the committed keripy oracle
 * fixtures (tiny-*.cesr) carry the CI-visible differential coverage.
 *
 * Both CESR-1 and CESR-2 samples are listed: the walker frames v2 natively now (decision q9rd3m),
 * so the v2 twins (samples/*-cesr2.cesr) are locked to the same delta-0/fully-known invariants. */

// The universal material-quadlet wrapper, per genus — GENUS-AWARE because the codes collide: v1's
// -V/-0V vs v2's -C/--C AttachmentGroup (in v1, -C is NonTransReceiptCouples, not a wrapper).
const isWrapper = (g: AttachmentGroup) =>
  g.genus === 2 ? g.code === '-C' || g.code === '--C' : g.code === '-V' || g.code === '-0V';

interface Sample {
  path: string;
  messages: number;
  /** Expected count of universal wrappers that have children (0 for controller-signed KELs with
   *  bare sig groups and no wrapper). */
  wrappers: number;
}
const SAMPLES: Sample[] = [
  { path: 'samples/witness-controller-kel-cesr1.cesr', messages: 4, wrappers: 4 },
  { path: 'samples/witness-role-oobi-cesr1.cesr', messages: 1, wrappers: 1 },
  { path: 'samples/kel-icp-rot-ixn-cesr1.cesr', messages: 3, wrappers: 0 },
  { path: 'samples/witness-controller-kel-cesr2.cesr', messages: 4, wrappers: 4 },
  { path: 'samples/witness-role-oobi-cesr2.cesr', messages: 1, wrappers: 1 },
];

/** Collect every group node in the attachment forest of a message. */
function groups(node: AttachmentNode, acc: AttachmentGroup[]): AttachmentGroup[] {
  if (node.kind === 'group') {
    acc.push(node);
    node.items.forEach((child) => groups(child, acc));
  }
  return acc;
}

describe('walk — real corpus regression guard', () => {
  for (const sample of SAMPLES) {
    const present = existsSync(sample.path);

    it.skipIf(!present)(`frames ${sample.path} to delta 0 with a fully-tiled, fully-known decomposition`, () => {
      const bytes = new Uint8Array(readFileSync(sample.path));
      const { messages, errors, consumed } = walk(bytes);

      expect(errors).toEqual([]);
      expect(consumed).toBe(bytes.length); // delta 0 — the whole stream is framed
      expect(messages).toHaveLength(sample.messages);

      const allGroups = messages.flatMap((m) => m.attachments.flatMap((g) => groups(g, [])));
      // every node is fully recognised (these samples exercise only modelled codes)
      expect(allGroups.filter((g) => g.state !== 'known')).toEqual([]);
      // every wrapper is exactly tiled by its inner groups (last child ends at the wrapper's end)
      const wrappers = allGroups.filter((g) => isWrapper(g) && g.items.length > 0);
      expect(wrappers).toHaveLength(sample.wrappers);
      for (const w of wrappers) {
        expect(w.items[w.items.length - 1].span.end).toBe(w.span.end);
      }
    });
  }
});
