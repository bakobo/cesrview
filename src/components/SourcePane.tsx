import type { PrettyDoc } from '../cesr/prettyprint';

/** The read-only source pane: the pretty-printed stream rendered as numbered lines, each carrying its
 * original byte span (data-start/data-end) for byte<->node selection sync (added in 3b). A lighter
 * hand-rolled pane instead of CodeMirror (decision s5kn7w). ~5ak2 — windowing/virtualization for
 * large streams is deferred; this renders every line for now. */
export function SourcePane({ doc }: { doc: PrettyDoc }) {
  return (
    <div className="cesr-source" role="region" aria-label="Source">
      <ol className="cesr-source-lines">
        {doc.lines.map((line, k) => (
          <li key={k} className="cesr-source-line" data-start={line.span?.start} data-end={line.span?.end}>
            <code>{line.text}</code>
          </li>
        ))}
      </ol>
    </div>
  );
}
