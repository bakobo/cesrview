import { useDeferredValue, useMemo, useState } from 'react';
import { walk } from './cesr/walk';
import { prettyPrint } from './cesr/prettyprint';
import { organize } from './model/stream';
import { collapseRuns } from './model/collapse';
import { AnnotationDock } from './components/AnnotationDock';
import { CesrViewProvider } from './components/CesrView';
import { DecodedEvent } from './components/DecodedEvent';
import { EventList } from './components/EventList';
import { Header } from './components/Header';
import { LeftRail } from './components/LeftRail';
import { RunCard } from './components/RunCard';
import { SourcePane } from './components/SourcePane';

const encoder = new TextEncoder();

export default function App() {
  const [text, setText] = useState('');
  const [sourceOpen, setSourceOpen] = useState(false);
  // Decode the DEFERRED text so the input stays responsive on a large paste (aria-busy shows a
  // "decoding…" indicator). Every parse/derive is MEMOISED on its inputs so a source-pane toggle or
  // any other state change never re-parses the stream (this.i m7kv3n / v3mk7n).
  const deferredText = useDeferredValue(text);
  const pending = text !== deferredText;
  const bytes = useMemo(() => encoder.encode(deferredText), [deferredText]);
  const result = useMemo(() => walk(bytes), [bytes]);
  const model = useMemo(() => organize(result), [result]);
  const items = useMemo(() => collapseRuns(result.messages), [result]);
  const doc = useMemo(() => (sourceOpen ? prettyPrint(result, bytes) : null), [sourceOpen, result, bytes]);
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
              {result.errors.length > 0 ? <p role="alert">{result.errors[0].message}</p> : null}
              <EventList
                items={items}
                renderItem={(item, k) =>
                  item.kind === 'event' ? (
                    <div key={k} id={`event-${item.index}`}>
                      <DecodedEvent message={item.message} bytes={bytes} />
                    </div>
                  ) : (
                    <RunCard key={k} messages={item.messages} start={item.start} bytes={bytes} />
                  )
                }
              />
            </div>
            <aside className="cesr-source-panel">
              <button className="source-toggle" aria-expanded={sourceOpen} onClick={() => setSourceOpen((o) => !o)}>
                Source
              </button>
              {sourceOpen ? <SourcePane doc={doc!} /> : null}
            </aside>
            <AnnotationDock />
          </div>
        </CesrViewProvider>
      )}
    </div>
  );
}
