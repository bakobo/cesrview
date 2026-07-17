import type { StreamDescription } from '../model/describe';
import { ThemeToggle } from './ThemeToggle';

/** The app header: the cesrview brand, stream statistics, an inferred stream KIND (with the full
 * composition on hover), and the honest "structure only" integrity notice (b6zx2d — cesrview makes no
 * cryptographic-validity claims). Part of the 3-region shell. */
export function Header({
  events,
  logs,
  encoding,
  stream,
}: {
  events: number;
  logs: number;
  encoding: string;
  stream: StreamDescription | null;
}) {
  return (
    <header className="cesr-header">
      <h1 className="brand">
        <span className="sq" aria-hidden="true" />
        cesr<b>view</b>
      </h1>
      <div className="stat">
        {stream ? (
          <span className="stat-stream" title={stream.composition}>
            stream <b className="mono">{stream.kind}</b>
          </span>
        ) : null}
        <span>
          events <b className="mono">{events}</b>
        </span>
        <span>
          logs <b className="mono">{logs}</b>
        </span>
        <span>
          encoding <b className="mono">{encoding}</b>
        </span>
      </div>
      <div className="banner">
        <span className="chip warn">
          <span className="dot" aria-hidden="true" />
          structure only · not cryptographically verified
        </span>
      </div>
      <ThemeToggle />
      <a className="gallery-link" href="#gallery">
        gallery ↗
      </a>
    </header>
  );
}
