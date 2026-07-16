import { annotate } from '../annotate/codes';
import type { Primitive } from '../cesr/types';
import { ValueChip } from './ValueChip';
import { roleOfPrimitive } from './fingerprint';

const td = new TextDecoder();

/** Renders one CESR primitive as a cross-reference pill: its text value (sliced from the source bytes
 * at the node's span), labelled with the code and its gloss, tagged with a role (sig/digest/key). */
export function PrimitiveChip({ node, bytes }: { node: Primitive; bytes: Uint8Array }) {
  const value = td.decode(bytes.subarray(node.span.start, node.span.end));
  const ann = annotate(node.class, node.code);
  const label = ann ? `${node.code}: ${ann.gloss}` : node.code;
  return <ValueChip value={value} label={label} code={node.code} role={roleOfPrimitive(node.code, node.class)} />;
}
