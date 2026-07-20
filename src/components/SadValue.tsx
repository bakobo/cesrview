import { annotateField } from '../annotate/codes';
import { highEntropy } from './CesrView';
import { SpecLink } from './SpecLink';
import { StreamPill } from './StreamPill';

/** Renders a message-body field value: a high-entropy string becomes a cross-reference chip, an array
 * renders each element, a nested OBJECT (e.g. an anchored seal `{i, s, d}` on an ixn) renders as a
 * structured key/value block rather than raw JSON, and a bare scalar is plain text (decision c7vn4k). */
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
  if (value !== null && typeof value === 'object') {
    return (
      <span className="cesr-obj">
        {Object.entries(value as Record<string, unknown>).map(([k, v]) => {
          const fa = annotateField(k);
          return (
            <span key={k} className="cesr-obj-row">
              <span className="cesr-obj-k">
                {k}
                {fa ? (
                  <span className="k-gloss">
                    {' ('}
                    <SpecLink gloss={fa.gloss} spec={fa.spec} find={fa.find} />)
                  </span>
                ) : null}
              </span>
              <SadValue value={v} />
            </span>
          );
        })}
      </span>
    );
  }
  return <>{JSON.stringify(value)}</>; // a bare scalar (number, boolean, null)
}
