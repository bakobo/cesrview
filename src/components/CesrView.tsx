import { createContext, useContext, useState, type ReactNode } from 'react';

interface ViewState {
  selected: string | null;
  select: (value: string | null) => void;
}
const ViewContext = createContext<ViewState | null>(null);

/** True for a high-entropy value worth cross-referencing — a base64url string of 44 or more chars
 * (AIDs, digests and keys are 44, signatures 88). Excludes thresholds, ilks, sequence numbers. */
export function highEntropy(value: string): boolean {
  return /^[A-Za-z0-9_-]{44,}$/.test(value);
}

/** Optional provider of shared viewer state — the cross-reference selection (decision c7vn4k). Wrap a
 * subtree to make its pills correlate; without it, components still render but do not coordinate. */
export function CesrViewProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  return <ViewContext.Provider value={{ selected, select: setSelected }}>{children}</ViewContext.Provider>;
}

/** Cross-reference state for one value: whether it is the current selection, and a setter that makes
 * it the selection (so every occurrence of the same value highlights). A no-op with no provider. */
export function useCrossRef(value: string) {
  const ctx = useContext(ViewContext);
  const isSelected = ctx !== null && ctx.selected === value;
  const select = () => ctx?.select(value);
  return { isSelected, select };
}
