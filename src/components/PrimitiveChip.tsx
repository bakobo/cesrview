import { annotate } from '../annotate/codes';
import type { Primitive } from '../cesr/types';
import { ValueChip } from './ValueChip';

const td = new TextDecoder();

/** Renders one CESR primitive: its text value (sliced from the source bytes at the node's span) as a
 * cross-reference ValueChip, labelled with the code and its gloss. */
export function PrimitiveChip({ node, bytes }: { node: Primitive; bytes: Uint8Array }) {
  const value = td.decode(bytes.subarray(node.span.start, node.span.end));
  const ann = annotate(node.class, node.code);
  const label = ann ? `${node.code}: ${ann.gloss}` : node.code;
  return <ValueChip value={value} label={label} code={node.code} />;
}
