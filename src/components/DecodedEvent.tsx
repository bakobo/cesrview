import { useState } from 'react';
import { annotate } from '../annotate/codes';
import type { CesrMessage } from '../cesr/types';
import { AttachmentGroup } from './AttachmentGroup';

/** Render a message-body field value; complex values (arrays/objects) as compact JSON. */
function renderValue(v: unknown): string {
  return typeof v === 'string' ? v : JSON.stringify(v);
}

/** Renders one decoded message: the signed STATEMENT as the foreground (the ilk with its gloss, and
 * the body fields), with the cryptographic proof band demoted to a collapsed-by-default section
 * (this.i v3nk7t). A framed-but-undecoded body (sad null, e.g. CBOR/MGPK without a decoder) shows a
 * clear undecoded state (r7cm3b). */
export function DecodedEvent({ message, bytes }: { message: CesrMessage; bytes: Uint8Array }) {
  const ilkAnn = message.ilk ? annotate('ilk', message.ilk) : null;
  const [proofOpen, setProofOpen] = useState(false);
  return (
    <article className="cesr-event">
      <header className="cesr-statement-head">
        {message.ilk ? (
          <span className="ilk" title={ilkAnn?.gloss}>
            {message.ilk}
            {ilkAnn ? ` — ${ilkAnn.gloss}` : ''}
          </span>
        ) : (
          <span className="ilk">{message.kind} message</span>
        )}
      </header>
      {message.sad ? (
        <dl className="cesr-statement">
          {Object.entries(message.sad).map(([k, v]) => (
            <div key={k} className="field">
              <dt>{k}</dt>
              <dd>{renderValue(v)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="cesr-undecoded">
          Undecoded {message.kind} body ({message.span.end - message.span.start} bytes)
        </p>
      )}
      {message.attachments.length > 0 ? (
        <section className="cesr-proof">
          <button className="cesr-proof-toggle" aria-expanded={proofOpen} onClick={() => setProofOpen((o) => !o)}>
            Proof ({message.attachments.length})
          </button>
          {proofOpen
            ? message.attachments.map((g, k) => <AttachmentGroup key={k} node={g} bytes={bytes} />)
            : null}
        </section>
      ) : null}
    </article>
  );
}
