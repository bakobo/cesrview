import { useState } from 'react';
import type { PrintScope } from './usePrint';

const SCOPES: ReadonlyArray<readonly [PrintScope, string]> = [
  ['source', 'Prettified stream (long)'],
  ['outline', 'Outline'],
  ['exhibit', 'This event'],
];

/** The interim print trigger (p9rn5t): a small header disclosure that offers the three print scopes
 * until the ~3xh2 right-click menu can drive print() instead. Choosing a scope fires onPrint and
 * closes. Native Ctrl+P still works independently — it prints the default (exhibit) scope. */
export function PrintMenu({ onPrint }: { onPrint: (scope: PrintScope) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="print-menu">
      <button
        type="button"
        className="print-toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Print…"
        onClick={() => setOpen((o) => !o)}
      >
        ⎙ print
      </button>
      {open ? (
        <div className="print-pop" role="menu">
          {SCOPES.map(([scope, label]) => (
            <button
              key={scope}
              type="button"
              role="menuitem"
              onClick={() => {
                onPrint(scope);
                setOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
