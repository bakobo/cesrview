import { useState } from 'react';
import { SAMPLES, type SampleMeta } from '../samples/catalog';
import { fetchSample } from '../samples/fetchSample';

/** The "try an example" affordance for the empty state (decision e7xm4p). Offers one button per
 *  curated sample; a click fetches the sample's CESR text from the same-origin library and hands it
 *  to `onLoad` (which replaces the stream — the SAME load path as paste/drop, no new parse). While a
 *  fetch is in flight every button is disabled; a fail-closed error is shown in place. */
export function SamplePicker({ onLoad }: { onLoad: (text: string) => void }) {
  const [loading, setLoading] = useState<string | null>(null); // id of the sample being fetched
  const [error, setError] = useState<string | null>(null);

  const load = async (sample: SampleMeta) => {
    setLoading(sample.id);
    setError(null);
    const result = await fetchSample(sample.file);
    if (result.ok) {
      onLoad(result.text);
    } else {
      setError(result.error.message);
    }
    setLoading(null);
  };

  return (
    <div className="sample-picker">
      <p className="sample-picker-lead">examples</p>
      <ul className="sample-list">
        {SAMPLES.map((sample) => (
          <li key={sample.id}>
            <button
              type="button"
              className="sample-button"
              disabled={loading !== null}
              title={sample.description}
              onClick={() => load(sample)}
            >
              {sample.label}
            </button>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="sample-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
