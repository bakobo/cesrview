import { useCrossRef } from './CesrView';

/** A high-entropy value rendered as a selectable cross-reference control. Selecting it highlights
 * every ValueChip in the same CesrView whose value is equal (decision c7vn4k). Shows as a plain
 * placeholder chip; the entviz fingerprint pill replaces it once entviz settles (tick ~2o7m). */
export function ValueChip({ value, label, code }: { value: string; label?: string; code?: string }) {
  const { isSelected, select } = useCrossRef(value);
  return (
    <button
      type="button"
      className="cesr-value"
      data-code={code}
      data-selected={isSelected || undefined}
      aria-label={label ?? value}
      aria-pressed={isSelected}
      onClick={select}
    >
      {value}
    </button>
  );
}
