import { highEntropy } from './CesrView';
import { ValueChip } from './ValueChip';

/** Renders a message-body field value: a high-entropy string becomes a cross-reference chip, an
 * array renders each element, and anything else is plain text (decision c7vn4k). */
export function SadValue({ value }: { value: unknown }) {
  if (typeof value === 'string') {
    return highEntropy(value) ? <ValueChip value={value} /> : <>{value}</>;
  }
  if (Array.isArray(value)) {
    return (
      <span className="cesr-array">
        {value.map((v, k) => (
          <SadValue key={k} value={v} />
        ))}
      </span>
    );
  }
  return <>{JSON.stringify(value)}</>;
}
