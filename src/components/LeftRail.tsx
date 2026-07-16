import { Entviz } from '@entviz/react';
import type { CesrMessage } from '../cesr/types';
import type { EventLog } from '../model/stream';
import { StreamPill } from './StreamPill';

/** The left rail: the OUTLINE of events IN STREAM ORDER — the arrival sequence is load-bearing and is
 * never grouped or hidden (m3xq7c / k2vx5n) — each row enriched with its owning-identifier glyph and
 * an explicit hex sn so interleaved per-identifier sequences read correctly (click to jump); plus an
 * IDENTIFIER INDEX of the owning AIDs as pills (click to cross-reference). */
export function LeftRail({
  messages,
  logs,
  onGo,
}: {
  messages: CesrMessage[];
  logs: EventLog[];
  onGo: (index: number) => void;
}) {
  return (
    <nav className="cesr-rail" aria-label="Outline and identifiers">
      <section>
        <h2 className="rail-h">Outline · {messages.length}</h2>
        <ol className="rail-outline">
          {messages.map((m, k) => {
            const owner = typeof m.sad?.i === 'string' ? m.sad.i : null;
            return (
              <li key={k}>
                <button
                  type="button"
                  className="toc-item"
                  aria-label={`event ${k}: ${m.ilk ?? m.kind}${m.sn !== null ? `, sn ${m.sn}` : ''}`}
                  onClick={() => onGo(k)}
                >
                  {owner ? (
                    <span className="owner" title={owner}>
                      <Entviz value={owner} style={{ width: 16, height: 16 }} />
                    </span>
                  ) : (
                    <span className="owner owner-none" aria-hidden="true" />
                  )}
                  <span className={`ilk${m.ilk ? ` ilk-${m.ilk}` : ''}`}>{m.ilk ?? m.kind}</span>
                  {m.sn !== null ? (
                    <span className="seq" title="sequence number (hex)">
                      sn {m.sn}
                    </span>
                  ) : null}
                </button>
              </li>
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
