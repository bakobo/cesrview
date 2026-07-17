import type { CesrMessage } from '../cesr/types';
import { DecodedEvent } from './DecodedEvent';

/** A collapsed run of consecutive same-owner interaction events (decision r6nk2w): a compact summary
 * showing the count and sn span, which expands IN PLACE to the individual event cards at their exact
 * stream positions. Nothing is reordered or hidden — one click reveals every event. Expansion is
 * CONTROLLED by the host so an outline jump into the run can expand it before scrolling (3apb). */
export function RunCard({
  messages,
  start,
  bytes,
  open,
  onToggle,
}: {
  messages: CesrMessage[];
  start: number;
  bytes: Uint8Array;
  open: boolean;
  onToggle: () => void;
}) {
  if (open) {
    return (
      <>
        {messages.map((m, k) => (
          <div key={k} id={`event-${start + k}`}>
            <DecodedEvent message={m} bytes={bytes} />
          </div>
        ))}
      </>
    );
  }
  const first = messages[0];
  const last = messages[messages.length - 1];
  return (
    <div className="cesr-run" id={`event-${start}`}>
      <button type="button" className="run-toggle" onClick={onToggle}>
        <span className="run-count">{messages.length}×</span>
        <span className="run-label">
          interaction events · sn {first.sn}–{last.sn}
        </span>
        <span className="run-expand">expand ▾</span>
      </button>
    </div>
  );
}
