import { useDeferredValue, useState } from 'react';
import { walk } from './cesr/walk';
import { prettyPrint } from './cesr/prettyprint';
import { organize } from './model/stream';
import { AnnotationDock } from './components/AnnotationDock';
import { CesrViewProvider } from './components/CesrView';
import { DecodedEvent } from './components/DecodedEvent';
import { Header } from './components/Header';
import { LeftRail } from './components/LeftRail';
import { SourcePane } from './components/SourcePane';

const encoder = new TextEncoder();

export default function App() {
  const [text, setText] = useState('');
  const [sourceOpen, setSourceOpen] = useState(false);
  // Decode the DEFERRED text: while a large paste is being processed the input stays responsive and
  // the app is marked aria-busy so a "decoding…" indicator shows (this.i m7kv3n / r7cm3b).
  const deferredText = useDeferredValue(text);
  const pending = text !== deferredText;
  const bytes = encoder.encode(deferredText);
  const result = walk(bytes);
  const model = organize(result);
  const first = result.messages[0];
  const encoding = first ? `${first.proto} ${first.version} · ${first.kind}` : '—';
  const goto = (index: number) => document.getElementById(`event-${index}`)?.scrollIntoView?.({ block: 'start' });

  return (
    <div className="cesr-app" aria-busy={pending}>
      <Header events={result.messages.length} logs={model.logs.length} encoding={encoding} />
      <div className="cesr-input">
        <textarea
          aria-label="CESR stream"
          placeholder="Paste a CESR stream — a KEL, TEL, ACDC, or OOBI response."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <span className="decoding" role="status">
          decoding…
        </span>
      </div>
      {text.trim() === '' ? (
        <p className="cesr-empty">Paste CESR above to decode it.</p>
      ) : (
        <CesrViewProvider>
          <div className={`cesr-main${sourceOpen ? ' source-open' : ''}`}>
            <LeftRail messages={result.messages} logs={model.logs} onGo={goto} />
            <div className="cesr-center">
              {result.messages.map((m, k) => (
                <div key={k} id={`event-${k}`}>
                  <DecodedEvent message={m} bytes={bytes} />
                </div>
              ))}
              {result.errors.length > 0 ? <p role="alert">{result.errors[0].message}</p> : null}
            </div>
            <aside className="cesr-source-panel">
              <button className="source-toggle" aria-expanded={sourceOpen} onClick={() => setSourceOpen((o) => !o)}>
                Source
              </button>
              {sourceOpen ? <SourcePane doc={prettyPrint(result, bytes)} /> : null}
            </aside>
            <AnnotationDock />
          </div>
        </CesrViewProvider>
      )}
    </div>
  );
}
