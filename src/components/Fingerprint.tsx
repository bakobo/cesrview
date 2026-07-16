import { fingerprint } from './fingerprint';

/** The deterministic identity glyph for a value, as a small SVG (decision d4nk7v). Decorative
 * (aria-hidden) — the value itself is announced by the enclosing pill. */
export function Fingerprint({ value, size = 15, cells = 5 }: { value: string; size?: number; cells?: number }) {
  const grid = fingerprint(value, cells);
  const unit = size / cells;
  return (
    <svg className="cesr-fp" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {grid.flatMap((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c * unit} y={r * unit} width={unit} height={unit} /> : null,
        ),
      )}
    </svg>
  );
}
