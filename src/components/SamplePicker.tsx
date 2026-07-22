import { useState } from 'react';
import { SAMPLES, type SampleMeta } from '../samples/catalog';
import { fetchSample } from '../samples/fetchSample';

/** The persistent "Examples" affordance above the input (decisions e7xm4p / s8vp3x, dropdown form
 *  d4mx9k). A single disclosure button opens a menu of curated samples GROUPED by CESR version; a
 *  menu item fetches the sample's CESR text from the same-origin library and hands it to `onLoad`
 *  (the SAME load path as paste/drop, no new parse), then closes the menu. While a fetch is in flight
 *  the items are disabled; a fail-closed error is shown in place and the menu stays open to retry. */
const GENUS_LABEL: Record<SampleMeta['version'], string> = { '1': 'CESR 1.0', '2': 'CESR 2.0' };
const VERSIONS: SampleMeta['version'][] = ['1', '2'];

export function SamplePicker({ onLoad }: { onLoad: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null); // id of the sample being fetched
  const [error, setError] = useState<string | null>(null);

  const load = async (sample: SampleMeta) => {
    setLoading(sample.id);
    setError(null);
    const result = await fetchSample(sample.file);
    if (result.ok) {
      onLoad(result.text);
      setOpen(false); // the stream is loaded; collapse the menu
    } else {
      setError(result.error.message); // keep the menu open so the choice can be retried
    }
    setLoading(null);
  };

  return (
    <div className="sample-picker">
      <button
        type="button"
        className="sample-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Examples
        {/* decorative caret, kept OUT of the accessible name (Chromium folds ::after text into it) */}
        <span className="sample-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      {open ? (
        <ul className="sample-menu" role="menu" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
          {VERSIONS.map((v) => (
            <li key={v} role="none" className="sample-group">
              <p className="sample-group-head" role="presentation">
                {GENUS_LABEL[v]}
              </p>
              <ul role="none" className="sample-group-items">
                {SAMPLES.filter((s) => s.version === v).map((sample) => (
                  <li key={sample.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="sample-item"
                      disabled={loading !== null}
                      title={sample.description}
                      onClick={() => load(sample)}
                    >
                      {sample.label}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p role="alert" className="sample-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
