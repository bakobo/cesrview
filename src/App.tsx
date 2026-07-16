import { useState } from 'react';
import { walk } from './cesr/walk';
import { prettyPrint } from './cesr/prettyprint';
import { organize } from './model/stream';
import { AnnotationDock } from './components/AnnotationDock';
import { CesrViewProvider } from './components/CesrView';
import { DecodedEvent } from './components/DecodedEvent';
import { DualPane } from './components/DualPane';
import { Header } from './components/Header';
import { LeftRail } from './components/LeftRail';
import { SourcePane } from './components/SourcePane';

const encoder = new TextEncoder();

export default function App() {
  const [text, setText] = useState('');
  const bytes = encoder.encode(text);
  const result = walk(bytes);
  const doc = prettyPrint(result, bytes);
  const model = organize(result);
  const first = result.messages[0];
  const encoding = first ? `${first.proto} ${first.version} · ${first.kind}` : '—';
  const goto = (index: number) => document.getElementById(`event-${index}`)?.scrollIntoView?.({ block: 'start' });

  return (
    <div className="cesr-app">
      <Header events={result.messages.length} logs={model.logs.length} encoding={encoding} />
      <div className="cesr-input">
        <textarea
          aria-label="CESR stream"
          placeholder="Paste a CESR stream — a KEL, TEL, ACDC, or OOBI response."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      {text.trim() === '' ? (
        <p className="cesr-empty">Paste CESR above to decode it.</p>
      ) : (
        <CesrViewProvider>
          <div className="cesr-main">
            <LeftRail messages={result.messages} logs={model.logs} onGo={goto} />
            <div className="cesr-center">
              <DualPane
                source={<SourcePane doc={doc} />}
                decoded={result.messages.map((m, k) => (
                  <div key={k} id={`event-${k}`}>
                    <DecodedEvent message={m} bytes={bytes} />
                  </div>
                ))}
              />
              {result.errors.length > 0 ? <p role="alert">{result.errors[0].message}</p> : null}
            </div>
            <AnnotationDock />
          </div>
        </CesrViewProvider>
      )}
    </div>
  );
}
