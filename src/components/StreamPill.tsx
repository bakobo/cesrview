import { EntvizPill } from '@entviz/react';
import type { CodeCategory } from '../annotate/codes';
import { useAnnotationFocus, useCrossRef } from './CesrView';
import { STREAM_TRUST } from './trust';

/** A stream value rendered as an entviz pill in the one auditable corpus posture (decision e5vk7n).
 * It is not a generic pill: it is the cesrview-configured pill that applies `STREAM_TRUST` to every
 * value in a pasted stream, wires cross-reference highlight, and focuses the annotation dock. entviz
 * characterizes the value (its scheme/role) and supplies the recognition aids that make recurrence
 * scannable. The pill's first-class LOCATE affordance ("Find other occurrences…") SELECTS the value —
 * every equal-valued pill then highlights via the pill's host-driven `highlight` (cross-ref, c7vn4k) —
 * and sends its code or value to the annotation dock. A no-op wrapper without a CesrViewProvider, so
 * the pill still renders standalone. */
export function StreamPill({
  value,
  label,
  annotation,
}: {
  value: string;
  label?: string;
  annotation?: { category: CodeCategory; code: string };
}) {
  const { isSelected, select } = useCrossRef(value);
  const { focus } = useAnnotationFocus();
  return (
    <span className="cesr-pill" data-value={value} data-selected={isSelected || undefined}>
      <EntvizPill
        value={value}
        label={label}
        trust={STREAM_TRUST}
        highlight={isSelected}
        typeSignal="autoCombo"
        // Cross-reference is now a DELIBERATE act (p7lk3n): the pill's first-class onLocate — its
        // "Find other occurrences…" popover action — SELECTS this value (every equal-valued pill then
        // highlights) and explains it in the dock. Recognition, never verification (v7kd3m); no longer
        // an incidental side effect of merely expanding the pill.
        onLocate={() => {
          select();
          focus(annotation ? { kind: 'code', ...annotation, value } : { kind: 'value', value });
        }}
      />
    </span>
  );
}
