import type { CodeCategory } from '../annotate/codes';
import { useAnnotationFocus, useCrossRef } from './CesrView';
import { Fingerprint } from './Fingerprint';
import { colorBucket, shorten } from './fingerprint';

/** A high-entropy value rendered as an entviz-style pill: a deterministic fingerprint glyph (the
 * primary identity cue, v7kd3m), the shortened value, and an optional role, in a CVD-safe colour
 * bucket. Clicking it highlights every equal-valued pill (cross-ref, c7vn4k) AND sends its code or
 * value to the annotation dock (b4wnk7). The glyph is a stand-in until entviz settles (~2o7m). */
export function ValueChip({
  value,
  label,
  role,
  code,
  annotation,
}: {
  value: string;
  label?: string;
  role?: string;
  code?: string;
  annotation?: { category: CodeCategory; code: string };
}) {
  const { isSelected, select } = useCrossRef(value);
  const { focus } = useAnnotationFocus();
  const onClick = () => {
    select();
    focus(annotation ? { kind: 'code', ...annotation, value } : { kind: 'value', value });
  };
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
      onClick={onClick}
    >
      <Fingerprint value={value} />
      <span className="pill-val">{shorten(value)}</span>
      {role ? <span className="pill-role">{role}</span> : null}
    </button>
  );
}
