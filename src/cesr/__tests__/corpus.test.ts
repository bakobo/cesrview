import { existsSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { walk } from '../walk';
import type { AttachmentGroup, AttachmentNode } from '../types';

/* Local corpus regression guard. Runs the walker over the real (gitignored, PII-bearing) samples
 * and locks the framing invariants that every increment must preserve: delta-0 framing, zero
 * errors, exact wrapper tiling, and — for these fully-modelled samples — zero unknown/invalid
 * nodes. Auto-skips where the corpus is absent (CI, fresh clones); the committed keripy oracle
 * fixtures (tiny-*.cesr) carry the CI-visible differential coverage. */

interface Sample {
  path: string;
  messages: number;
}
const SAMPLES: Sample[] = [
  { path: 'samples/multisig-oobi.cesr', messages: 102 },
  { path: 'samples/credential.cesr', messages: 361 },
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
      const wrappers = allGroups.filter((g) => (g.code === '-V' || g.code === '-0V') && g.items.length > 0);
      expect(wrappers).not.toHaveLength(0);
      for (const w of wrappers) {
        expect(w.items[w.items.length - 1].span.end).toBe(w.span.end);
      }
    });
  }
});
