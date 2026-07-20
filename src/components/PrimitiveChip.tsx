import type { Primitive } from '../cesr/types';
import { daterToIso } from '../cesr/dater';
import { DatetimeValue } from './DatetimeValue';
import { StreamPill } from './StreamPill';

const td = new TextDecoder();

/** Renders one CESR primitive (a proof/attachment value: signature, digest, seal) as an entviz pill
 * carrying its text value sliced from the source bytes. No host label is passed: entviz would let an
 * explicit label win over the value mnemonic (shownLabel = label ?? autoMnemonic), so a per-primitive
 * code+gloss caption would displace the scannable first4..mid4..last4 stub with a long, non-value
 * string (m8pv3k). The code/gloss teaching lives on the enclosing counter group header instead, and
 * entviz characterizes each value's scheme/role itself (e5vk7n).
 *
 * Exception: a CESR datetime (Dater) is NOT entropy — an entviz pill would render it as "raw". Decode
 * it and show it with the same DatetimeValue used for the `dt` field, so proof datetimes read like
 * datetimes everywhere else in a decoded event. */
export function PrimitiveChip({ node, bytes }: { node: Primitive; bytes: Uint8Array }) {
  const value = td.decode(bytes.subarray(node.span.start, node.span.end));
  const iso = daterToIso(value);
  if (iso !== null) return <DatetimeValue value={iso} />;
  return <StreamPill value={value} />;
}
