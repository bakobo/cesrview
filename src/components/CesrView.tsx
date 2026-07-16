import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CodeCategory } from '../annotate/codes';

/** What the annotation dock is currently explaining: a structural code, or a bare identifier value. */
export type FocusTarget =
  | { kind: 'code'; category: CodeCategory; code: string; value?: string }
  | { kind: 'value'; value: string };

interface ViewState {
  selected: string | null;
  select: (value: string | null) => void;
  focused: FocusTarget | null;
  focus: (target: FocusTarget | null) => void;
}
const ViewContext = createContext<ViewState | null>(null);

/** True for a high-entropy value worth cross-referencing — a base64url string of 44 or more chars
 * (AIDs, digests and keys are 44, signatures 88). Excludes thresholds, ilks, sequence numbers. */
export function highEntropy(value: string): boolean {
  return /^[A-Za-z0-9_-]{44,}$/.test(value);
}

/** Optional provider of shared viewer state — cross-reference selection and annotation focus
 * (decisions c7vn4k / b4wnk7). Wrap a subtree to make its pills correlate and feed the dock; without
 * it, components still render but do not coordinate. */
export function CesrViewProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [focused, setFocused] = useState<FocusTarget | null>(null);
  return (
    <ViewContext.Provider value={{ selected, select: setSelected, focused, focus: setFocused }}>
      {children}
    </ViewContext.Provider>
  );
}

/** Cross-reference state for one value: whether it is the current selection, and a setter that makes
 * it the selection (so every occurrence of the same value highlights). A no-op with no provider. */
export function useCrossRef(value: string) {
  const ctx = useContext(ViewContext);
  const isSelected = ctx !== null && ctx.selected === value;
  const select = () => ctx?.select(value);
  return { isSelected, select };
}

/** The annotation-dock focus: what is being explained, and a setter. No-op without a provider. */
export function useAnnotationFocus() {
  const ctx = useContext(ViewContext);
  return { focused: ctx?.focused ?? null, focus: (target: FocusTarget | null) => ctx?.focus(target) };
}
