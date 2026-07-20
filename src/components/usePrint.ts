import { useCallback, useEffect, useState } from 'react';

/** Which single top-level component a printout captures (decision 3p4cnyq7). */
export type PrintScope = 'transcript' | 'manifest' | 'exhibit';

/** Drives Model-A printing (3p4cnyq7 / p9rn5t): it mirrors the requested scope onto <html> as
 * `data-print-scope` (the @media print CSS keys off it) and opens the browser print dialog.
 *
 * The default scope is `exhibit` — the one scope always fully in the DOM (a single event) — so a
 * bare native Ctrl+P is never the transcript truncation trap. A transcript print is FAIL-CLOSED: the
 * source view renders progressively (v3mk7n), so we first force EVERY line into the DOM (`expandAll`)
 * and only open the dialog on the NEXT commit, once the whole stream is really there. */
export function usePrint() {
  const [scope, setScope] = useState<PrintScope>('exhibit');
  const [expandAll, setExpandAll] = useState(false);
  const [pending, setPending] = useState(false);

  // Reflect the scope onto <html> so the print stylesheet can hide the other components.
  useEffect(() => {
    document.documentElement.dataset.printScope = scope;
  }, [scope]);

  // Step 1: a pending transcript print first expands every line into the DOM.
  useEffect(() => {
    if (pending && scope === 'transcript' && !expandAll) setExpandAll(true);
  }, [pending, scope, expandAll]);

  // Step 2: once the DOM reflects the scope — and, for the transcript, all lines — open the dialog.
  useEffect(() => {
    if (!pending) return;
    if (scope === 'transcript' && !expandAll) return; // wait for step 1's commit
    window.print();
    setPending(false);
  }, [pending, scope, expandAll]);

  // Restore the interactive state once the print dialog closes.
  useEffect(() => {
    const done = () => {
      setScope('exhibit');
      setExpandAll(false);
    };
    window.addEventListener('afterprint', done);
    return () => window.removeEventListener('afterprint', done);
  }, []);

  const print = useCallback((s: PrintScope) => {
    setScope(s);
    setPending(true);
  }, []);

  return { scope, expandAll, print };
}
