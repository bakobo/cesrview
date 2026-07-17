import { highEntropy } from './CesrView';
import { StreamPill } from './StreamPill';

/** Renders a message-body field value: a high-entropy string becomes a cross-reference chip, an
 * array renders each element, and anything else is plain text (decision c7vn4k). */
export function SadValue({ value }: { value: unknown }) {
  if (typeof value === 'string') {
    return highEntropy(value) ? <StreamPill value={value} /> : <>{value}</>;
  }
  if (Array.isArray(value)) {
    return (
      <span className="cesr-array">
        {value.map((v, k) => (
          <span key={k} className="cesr-el">
            {k > 0 ? (
              <span className="cesr-sep" aria-hidden="true">
                ,{' '}
              </span>
            ) : null}
            <SadValue value={v} />
          </span>
        ))}
      </span>
    );
  }
  return <>{JSON.stringify(value)}</>;
}
