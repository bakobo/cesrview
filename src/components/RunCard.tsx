import { useState } from 'react';
import type { CesrMessage } from '../cesr/types';
import { DecodedEvent } from './DecodedEvent';

/** A collapsed run of consecutive same-owner interaction events (decision r6nk2w): a compact summary
 * showing the count and sn span, which expands IN PLACE to the individual event cards at their exact
 * stream positions. Nothing is reordered or hidden — one click reveals every event. */
export function RunCard({ messages, start, bytes }: { messages: CesrMessage[]; start: number; bytes: Uint8Array }) {
  const [open, setOpen] = useState(false);
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
      <button type="button" className="run-toggle" onClick={() => setOpen(true)}>
        <span className="run-count">{messages.length}×</span>
        <span className="run-label">
          interaction events · sn {first.sn}–{last.sn}
        </span>
        <span className="run-expand">expand ▾</span>
      </button>
    </div>
  );
}
