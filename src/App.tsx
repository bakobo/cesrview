import { useState } from 'react';
import { walk } from './cesr/walk';
import { prettyPrint } from './cesr/prettyprint';
import { organize } from './model/stream';
import { CesrViewProvider } from './components/CesrView';
import { DecodedEvent } from './components/DecodedEvent';
import { DualPane } from './components/DualPane';
import { Header } from './components/Header';
import { SourcePane } from './components/SourcePane';

const encoder = new TextEncoder();

export default function App() {
  const [text, setText] = useState('');
  const bytes = encoder.encode(text);
  const result = walk(bytes);
  const doc = prettyPrint(result, bytes);
  const first = result.messages[0];
  const encoding = first ? `${first.proto} ${first.version} · ${first.kind}` : '—';

  return (
    <div className="cesr-app">
      <Header events={result.messages.length} logs={organize(result).logs.length} encoding={encoding} />
      <div className="cesr-input">
        <textarea
          aria-label="CESR stream"
          placeholder="Paste a CESR stream — a KEL, TEL, ACDC, or OOBI response."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="cesr-body">
        {text.trim() === '' ? (
          <p className="cesr-empty">Paste CESR above to decode it.</p>
        ) : (
          <CesrViewProvider>
            <DualPane
              source={<SourcePane doc={doc} />}
              decoded={result.messages.map((m, k) => (
                <DecodedEvent key={k} message={m} bytes={bytes} />
              ))}
            />
          </CesrViewProvider>
        )}
        {result.errors.length > 0 ? <p role="alert">{result.errors[0].message}</p> : null}
      </div>
    </div>
  );
}
