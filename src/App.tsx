import { useDeferredValue, useMemo, useState } from 'react';
import { walk } from './cesr/walk';
import { prettyPrint } from './cesr/prettyprint';
import { organize } from './model/stream';
import { describeStream } from './model/describe';
import { CesrViewProvider } from './components/CesrView';
import { DecodedEvent } from './components/DecodedEvent';
import { Header } from './components/Header';
import { LeftRail } from './components/LeftRail';
import { SourcePane } from './components/SourcePane';

const encoder = new TextEncoder();

export default function App() {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState(0);
  // Decode the DEFERRED text so the input stays responsive on a large paste (aria-busy shows a
  // "decoding…" indicator). Every parse/derive is MEMOISED on its inputs (this.i m7kv3n / v3mk7n).
  const deferredText = useDeferredValue(text);
  const pending = text !== deferredText;
  const bytes = useMemo(() => encoder.encode(deferredText), [deferredText]);
  const result = useMemo(() => walk(bytes), [bytes]);
  const model = useMemo(() => organize(result), [result]);
  const stream = useMemo(() => describeStream(result.messages, model.logs), [result, model]);
  // The pasted stream, prettified into the source view shown in the input panel (no separate pane).
  const doc = useMemo(() => (result.messages.length ? prettyPrint(result, bytes) : null), [result, bytes]);
  const first = result.messages[0];
  const encoding = first ? `${first.proto} ${first.version} · ${first.kind}` : '—';

  // The centre shows exactly ONE event at a time (n8kr4p) — the one selected in the outline. Clamp so a
  // fresh, shorter stream never dangles on a stale index; the outline drives navigation.
  const activeIndex = selected < result.messages.length ? selected : 0;
  const current = result.messages[activeIndex] ?? null;

  return (
    <div className="cesr-app" aria-busy={pending}>
      <Header events={result.messages.length} logs={model.logs.length} encoding={encoding} stream={stream} />
      <CesrViewProvider>
        <div className="cesr-main">
          <section className="cesr-input-panel">
            <textarea
              aria-label="CESR stream"
              placeholder="Paste a CESR stream — a KEL, TEL, ACDC, or OOBI response."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <span className="decoding" role="status">
              decoding…
            </span>
            {doc ? <SourcePane doc={doc} /> : null}
          </section>
          <LeftRail messages={result.messages} logs={model.logs} onGo={setSelected} selected={activeIndex} />
          <div className="cesr-center">
            {result.errors.length > 0 ? <p role="alert">{result.errors[0].message}</p> : null}
            {current ? (
              <DecodedEvent message={current} bytes={bytes} />
            ) : (
              <p className="cesr-empty">Paste CESR into the left panel to decode it.</p>
            )}
          </div>
        </div>
      </CesrViewProvider>
    </div>
  );
}
