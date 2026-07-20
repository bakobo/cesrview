import type { PrettyDoc } from '../cesr/prettyprint';
import { EventList } from './EventList';

/** The read-only source pane: the pretty-printed stream rendered PROGRESSIVELY as numbered lines
 * (decision v3mk7n) — the first chunk, then more on scroll — so a large stream never freezes on open.
 * Each line carries its original byte span (data-start/data-end) for the coming selection sync (3b).
 * A lighter hand-rolled pane instead of CodeMirror (decision s5kn7w). */
export function SourcePane({ doc, expandAll = false }: { doc: PrettyDoc; expandAll?: boolean }) {
  return (
    <div className="cesr-source" role="region" aria-label="Source">
      <EventList
        items={doc.lines}
        chunk={80}
        expandAll={expandAll}
        renderItem={(line, k) => (
          <div key={k} className="cesr-source-line" data-start={line.span?.start} data-end={line.span?.end}>
            <span className="ln">{k + 1}</span>
            <code>{line.text}</code>
          </div>
        )}
      />
    </div>
  );
}
