import { useState } from 'react';
import { walk } from './cesr/walk';
import { CesrViewProvider } from './components/CesrView';
import { DecodedEvent } from './components/DecodedEvent';

const encoder = new TextEncoder();

export default function App() {
  const [text, setText] = useState('');
  const bytes = encoder.encode(text);
  const { messages, errors } = walk(bytes);
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
            {messages.map((m, k) => (
              <DecodedEvent key={k} message={m} bytes={bytes} />
            ))}
          </CesrViewProvider>
          {errors.length > 0 ? <p role="alert">{errors[0].message}</p> : null}
        </section>
      )}
    </main>
  );
}
