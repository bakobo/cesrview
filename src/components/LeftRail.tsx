import { Fragment } from 'react';
import type { CesrMessage } from '../cesr/types';
import type { EventLog } from '../model/stream';
import { StreamPill } from './StreamPill';

/** The left rail: the OUTLINE of events IN STREAM ORDER — the arrival sequence is load-bearing and is
 * never reordered or hidden (m3xq7c / k2vx5n). Rows stay lightweight NAV, not deep info: a 1-based
 * stream position, the event type, and an explicit hex sn (click to jump). Where the owner CHANGES, a
 * SECTION-HEADER row carries that identifier as an entviz PILL (collapsed — the full visualization only
 * ever appears when a person clicks a pill, never inline in the index). Below, an IDENTIFIER INDEX
 * lists the owning AIDs as pills (click to cross-reference). */
export function LeftRail({
  messages,
  logs,
  onGo,
  selected,
}: {
  messages: CesrMessage[];
  logs: EventLog[];
  onGo: (index: number) => void;
  selected: number;
}) {
  return (
    <nav className="cesr-rail" aria-label="Outline and identifiers">
      <section>
        <h2 className="rail-h">Outline · {messages.length} events</h2>
        <ol className="rail-outline">
          {messages.map((m, k) => {
            const owner = typeof m.sad?.i === 'string' ? m.sad.i : null;
            const prev = k > 0 ? messages[k - 1] : null;
            const prevOwner = typeof prev?.sad?.i === 'string' ? prev.sad.i : null;
            const startsSection = owner !== null && owner !== prevOwner;
            return (
              <Fragment key={k}>
                {startsSection ? (
                  <li className="rail-section">
                    <StreamPill value={owner} />
                  </li>
                ) : null}
                <li>
                  <button
                    type="button"
                    className={`toc-item${k === selected ? ' active' : ''}`}
                    aria-current={k === selected ? 'true' : undefined}
                    aria-label={`event ${k + 1}: ${m.ilk ?? m.kind}${m.sn !== null ? `, sn ${m.sn}` : ''}`}
                    onClick={() => onGo(k)}
                  >
                    <span className="toc-num" aria-hidden="true">
                      {k + 1}
                    </span>
                    <span className={`ilk${m.ilk ? ` ilk-${m.ilk}` : ''}`}>{m.ilk ?? m.kind}</span>
                    {m.sn !== null ? (
                      <span className="seq" title="sequence number (hex)">
                        sn {m.sn}
                      </span>
                    ) : null}
                  </button>
                </li>
              </Fragment>
            );
          })}
        </ol>
      </section>
      <section>
        <h2 className="rail-h">Identifiers · {logs.length}</h2>
        <div className="rail-ids">
          {logs.map((l) => (
            <StreamPill key={l.aid} value={l.aid} />
          ))}
        </div>
      </section>
    </nav>
  );
}
