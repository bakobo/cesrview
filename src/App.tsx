import { useState } from 'react';
import { walk } from './cesr/walk';
import { prettyPrint } from './cesr/prettyprint';
import { CesrViewProvider } from './components/CesrView';
import { DecodedEvent } from './components/DecodedEvent';
import { DualPane } from './components/DualPane';
import { SourcePane } from './components/SourcePane';

const encoder = new TextEncoder();

export default function App() {
  const [text, setText] = useState('');
  const bytes = encoder.encode(text);
  const result = walk(bytes);
  const doc = prettyPrint(result, bytes);
  return (
    <main>
      <h1>CESR Viewer</h1>
      <textarea
        aria-label="CESR stream"
        placeholder="Paste a CESR stream — a KEL, TEL, ACDC, or OOBI response."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {text.trim() === '' ? (
        <p>Paste CESR above to decode it.</p>
      ) : (
        <section aria-label="Decoded stream">
          <CesrViewProvider>
            <DualPane
              source={<SourcePane doc={doc} />}
              decoded={result.messages.map((m, k) => (
                <DecodedEvent key={k} message={m} bytes={bytes} />
              ))}
            />
          </CesrViewProvider>
          {result.errors.length > 0 ? <p role="alert">{result.errors[0].message}</p> : null}
        </section>
      )}
    </main>
  );
}
