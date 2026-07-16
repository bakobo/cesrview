import { useState } from 'react';
import { annotate } from '../annotate/codes';
import type { CesrMessage } from '../cesr/types';
import { AttachmentGroup } from './AttachmentGroup';
import { useAnnotationFocus } from './CesrView';
import { SadValue } from './SadValue';
import { StreamPill } from './StreamPill';

/** Renders one decoded message as an event card: the signed STATEMENT as the foreground (a color-
 * coded ilk badge with its gloss, the SAID pill, and the body fields), with the cryptographic proof
 * band demoted to a collapsed-by-default striped section (this.i v3nk7t / d4nk7v). A framed-but-
 * undecoded body (sad null, e.g. CBOR/MGPK without a decoder) shows a clear undecoded state (r7cm3b). */
export function DecodedEvent({ message, bytes }: { message: CesrMessage; bytes: Uint8Array }) {
  const ilkAnn = message.ilk ? annotate('ilk', message.ilk) : null;
  const { focus } = useAnnotationFocus();
  const [proofOpen, setProofOpen] = useState(false);
  const ilk = message.ilk;
  return (
    <article className="cesr-event" data-ilk={ilk ?? undefined}>
      <header className="ev-head">
        {ilk ? (
          <button
            type="button"
            className={`ev-ilk ilk-${ilk}`}
            title={ilkAnn?.gloss ?? undefined}
            onClick={() => focus({ kind: 'code', category: 'ilk', code: ilk })}
          >
            {ilk}
          </button>
        ) : (
          <span className="ev-ilk">{message.kind}</span>
        )}
        {ilkAnn ? <span className="ev-title">{ilkAnn.gloss}</span> : null}
        {message.sn !== null ? (
          <span className="ev-sub" title="sequence number (hex)">
            sn {message.sn}
          </span>
        ) : null}
        {message.said ? (
          <span className="ev-said">
            <StreamPill value={message.said} />
          </span>
        ) : null}
      </header>
      {message.sad ? (
        <dl className="statement">
          {Object.entries(message.sad).map(([k, v]) => (
            <div key={k} className="row">
              <dt className="k">{k}</dt>
              <dd className="v">
                <SadValue value={v} />
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="cesr-undecoded">
          Undecoded {message.kind} body ({message.span.end - message.span.start} bytes)
        </p>
      )}
      {message.attachments.length > 0 ? (
        <section className={`proof${proofOpen ? ' open' : ''}`}>
          <button className="proof-bar" aria-expanded={proofOpen} onClick={() => setProofOpen((o) => !o)}>
            <span className="caret">▸</span> Proof
            <span className="cnt"> · {message.attachments.length} group{message.attachments.length === 1 ? '' : 's'}</span>
          </button>
          {proofOpen ? (
            <div className="proof-body">
              {message.attachments.map((g, k) => (
                <AttachmentGroup key={k} node={g} bytes={bytes} />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
