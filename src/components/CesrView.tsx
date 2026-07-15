import { createContext, useContext, useState, type ReactNode } from 'react';

interface CrossRef {
  selected: string | null;
  select: (value: string | null) => void;
}
const CrossRefContext = createContext<CrossRef | null>(null);

/** True for a high-entropy value worth cross-referencing — a base64url string of 44 or more chars
 * (AIDs, digests and keys are 44, signatures 88). Excludes thresholds, ilks, sequence numbers. */
export function highEntropy(value: string): boolean {
  return /^[A-Za-z0-9_-]{44,}$/.test(value);
}

/** Optional provider of shared cross-reference selection (decision c7vn4k). Wrap a subtree to make
 * every ValueChip in it correlate; without it, chips still render but do not correlate. */
export function CesrViewProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  return <CrossRefContext.Provider value={{ selected, select: setSelected }}>{children}</CrossRefContext.Provider>;
}

/** Cross-reference state for one value: whether it is the current selection, and a toggle to
 * select/deselect it. A no-op when there is no surrounding CesrViewProvider. */
export function useCrossRef(value: string) {
  const ctx = useContext(CrossRefContext);
  const isSelected = ctx !== null && ctx.selected === value;
  const select = () => ctx?.select(isSelected ? null : value);
  return { isSelected, select };
}
