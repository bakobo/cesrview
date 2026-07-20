import type { Primitive } from '../cesr/types';
import { StreamPill } from './StreamPill';

const td = new TextDecoder();

/** Renders one CESR primitive (a proof/attachment value: signature, digest, seal) as an entviz pill
 * carrying its text value sliced from the source bytes. No host label is passed: entviz would let an
 * explicit label win over the value mnemonic (shownLabel = label ?? autoMnemonic), so a per-primitive
 * code+gloss caption would displace the scannable first4..mid4..last4 stub with a long, non-value
 * string (m8pv3k). The code/gloss teaching lives on the enclosing counter group header instead, and
 * entviz characterizes each value's scheme/role itself (e5vk7n). */
export function PrimitiveChip({ node, bytes }: { node: Primitive; bytes: Uint8Array }) {
  const value = td.decode(bytes.subarray(node.span.start, node.span.end));
  return <StreamPill value={value} />;
}
