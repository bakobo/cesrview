/** The app header: the cesrview brand, stream statistics, and the honest "structure only" integrity
 * notice (b6zx2d — cesrview makes no cryptographic-validity claims). Part of the 3-region shell. */
export function Header({ events, logs, encoding }: { events: number; logs: number; encoding: string }) {
  return (
    <header className="cesr-header">
      <h1 className="brand">
        <span className="sq" aria-hidden="true" />
        cesr<b>view</b>
      </h1>
      <div className="stat">
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
      <a className="gallery-link" href="#gallery">
        gallery ↗
      </a>
    </header>
  );
}
