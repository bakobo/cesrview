import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnnotationDock } from '../AnnotationDock';
import { CesrViewProvider, useAnnotationFocus, type FocusTarget } from '../CesrView';

/** Drives the dock: a button that focuses a target, rendered alongside the dock in one provider. */
function Harness({ target }: { target: FocusTarget }) {
  const { focus } = useAnnotationFocus();
  return (
    <>
      <button onClick={() => focus(target)}>set</button>
      <AnnotationDock />
    </>
  );
}
const set = (target: FocusTarget) => {
  render(
    <CesrViewProvider>
      <Harness target={target} />
    </CesrViewProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'set' }));
};

describe('AnnotationDock', () => {
  it('shows an empty prompt with nothing focused', () => {
    render(
      <CesrViewProvider>
        <AnnotationDock />
      </CesrViewProvider>,
    );
    expect(screen.getByText(/click a code, identifier/i)).toBeInTheDocument();
  });

  it('explains a focused code with its gloss and a spec link', () => {
    set({ kind: 'code', category: 'ilk', code: 'icp' });
    expect(screen.getByText('icp')).toBeInTheDocument();
    expect(screen.getByText(/inception/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read in the spec/i })).toHaveAttribute('href', expect.stringContaining('http'));
  });

  it('shows the value when a code focus carries one', () => {
    set({ kind: 'code', category: 'counter', code: '-A', value: '-AAB...' });
    expect(screen.getByText('-AAB...')).toBeInTheDocument();
  });

  it('notes when a focused code is not annotated yet', () => {
    set({ kind: 'code', category: 'ilk', code: 'vcp' }); // TEL ilk, deferred (~4kle)
    expect(screen.getByText(/not annotated yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a bare identifier value', () => {
    set({ kind: 'value', value: 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2' });
    expect(screen.getByText('EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2')).toBeInTheDocument();
    expect(screen.getByText('identifier')).toBeInTheDocument();
  });
});
