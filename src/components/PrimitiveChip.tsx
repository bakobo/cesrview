import { annotate } from '../annotate/codes';
import type { Primitive } from '../cesr/types';

const td = new TextDecoder();

/** Renders one CESR primitive: its text value (sliced from the source bytes at the node's span) with
 * the code and its gloss as an accessible label. The value shows as a plain placeholder chip; the
 * entviz fingerprint pill replaces it once entviz settles (this.i b4wnk7 / tick ~2o7m). */
export function PrimitiveChip({ node, bytes }: { node: Primitive; bytes: Uint8Array }) {
  const value = td.decode(bytes.subarray(node.span.start, node.span.end));
  const ann = annotate(node.class, node.code);
  const label = ann ? `${node.code}: ${ann.gloss}` : node.code;
  return (
    <span className="cesr-primitive" data-code={node.code} aria-label={label} title={label} tabIndex={0}>
      {value}
    </span>
  );
}
