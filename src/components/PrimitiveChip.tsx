import { annotate } from '../annotate/codes';
import type { Primitive } from '../cesr/types';
import { StreamPill } from './StreamPill';

const td = new TextDecoder();

/** Renders one CESR primitive as an entviz pill: its text value (sliced from the source bytes at the
 * node's span), with the code and its gloss as the pill's trusted label. entviz derives the value's
 * scheme/role itself (decision e5vk7n), so no role is passed in. */
export function PrimitiveChip({ node, bytes }: { node: Primitive; bytes: Uint8Array }) {
  const value = td.decode(bytes.subarray(node.span.start, node.span.end));
  const ann = annotate(node.class, node.code);
  const label = ann ? `${node.code}: ${ann.gloss}` : node.code;
  return <StreamPill value={value} label={label} annotation={{ category: node.class, code: node.code }} />;
}
