import type { CesrMessage } from '../cesr/types';
import type { EventLog } from '../model/stream';
import { ValueChip } from './ValueChip';

/** The left rail: an OUTLINE of the events (click to jump to one) and an IDENTIFIER INDEX of the
 * owning AIDs as glyph pills (click to cross-reference, decisions t2vd6m / c5nzr4). */
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
        <h2 className="rail-h">Outline</h2>
        <ol className="rail-outline">
          {messages.map((m, k) => (
            <li key={k}>
              <button
                type="button"
                className="toc-item"
                aria-label={`event ${k}: ${m.ilk ?? m.kind}${m.sn !== null ? ` seq ${m.sn}` : ''}`}
                onClick={() => onGo(k)}
              >
                <span className="seq">{m.sn ?? '—'}</span>
                <span className={`ilk${m.ilk ? ` ilk-${m.ilk}` : ''}`}>{m.ilk ?? m.kind}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
      <section>
        <h2 className="rail-h">Identifiers · {logs.length}</h2>
        <div className="rail-ids">
          {logs.map((l) => (
            <ValueChip key={l.aid} value={l.aid} role={l.kind} />
          ))}
        </div>
      </section>
    </nav>
  );
}
