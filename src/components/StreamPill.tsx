import { EntvizPill } from '@entviz/react';
import { useCrossRef } from './CesrView';
import { STREAM_TRUST } from './trust';

/** A stream value rendered as an entviz pill in the one auditable corpus posture (decision e5vk7n).
 * It is the cesrview-configured pill that applies `STREAM_TRUST` to every value in a pasted stream and
 * wires cross-reference highlight. entviz characterizes the value (its scheme/role) and supplies the
 * recognition aids that make recurrence scannable. The pill's first-class LOCATE affordance ("Find
 * other occurrences…") SELECTS the value — every equal-valued pill then highlights via the pill's
 * host-driven `highlight` (cross-ref, c7vn4k). A no-op wrapper without a CesrViewProvider, so the pill
 * still renders standalone. */
export function StreamPill({ value, label }: { value: string; label?: string }) {
  const { isSelected, select } = useCrossRef(value);
  return (
    <span className="cesr-pill" data-value={value} data-selected={isSelected || undefined}>
      <EntvizPill
        value={value}
        label={label}
        trust={STREAM_TRUST}
        highlight={isSelected}
        typeSignal="autoCombo"
        onLocate={select}
      />
    </span>
  );
}
