import { useCrossRef } from './CesrView';
import { Fingerprint } from './Fingerprint';
import { colorBucket, shorten } from './fingerprint';

/** A high-entropy value rendered as an entviz-style pill: a deterministic fingerprint glyph (the
 * primary identity cue, v7kd3m), the shortened value, and an optional role, in a CVD-safe colour
 * bucket. Selecting it highlights every pill in the same CesrView with an equal value (c7vn4k).
 * The glyph is a stand-in until the enhanced entviz pill lands (~2o7m). */
export function ValueChip({ value, label, role, code }: { value: string; label?: string; role?: string; code?: string }) {
  const { isSelected, select } = useCrossRef(value);
  return (
    <button
      type="button"
      className="cesr-pill"
      data-code={code}
      data-value={value}
      data-bucket={colorBucket(value)}
      data-selected={isSelected || undefined}
      aria-label={label ?? value}
      aria-pressed={isSelected}
      title={value}
      onClick={select}
    >
      <Fingerprint value={value} />
      <span className="pill-val">{shorten(value)}</span>
      {role ? <span className="pill-role">{role}</span> : null}
    </button>
  );
}
