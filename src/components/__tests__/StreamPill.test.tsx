import { render } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { describe, it, expect } from 'vitest';
import { StreamPill } from '../StreamPill';
import { CesrViewProvider } from '../CesrView';

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2';
const OTHER = '0AAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBB';
const pillFor = (c: HTMLElement, v: string) => c.querySelector<HTMLElement>(`.cesr-pill[data-value="${v}"]`);
const openFirst = (c: HTMLElement) => fireEvent.click(c.querySelector('.cesr-pill button')!);

describe('StreamPill', () => {
  it('renders an entviz pill carrying the value, unselected', () => {
    const { container } = render(<StreamPill value={AID} label="prefix" />);
    expect(pillFor(container, AID)).toBeInTheDocument();
    expect(pillFor(container, AID)).not.toHaveAttribute('data-selected');
  });

  it('does nothing when opened outside a provider (renders standalone)', () => {
    const { container } = render(<StreamPill value={AID} />);
    openFirst(container);
    expect(pillFor(container, AID)).not.toHaveAttribute('data-selected');
  });

  it('selecting a value highlights every pill with that value, and not others', () => {
    const { container } = render(
      <CesrViewProvider>
        <StreamPill value={AID} />
        <StreamPill value={AID} />
        <StreamPill value={OTHER} />
      </CesrViewProvider>,
    );
    openFirst(container); // opening a pill -> onOpenChange(true) -> select(AID)
    const aids = container.querySelectorAll(`.cesr-pill[data-value="${AID}"]`);
    expect([...aids].every((p) => p.hasAttribute('data-selected'))).toBe(true);
    expect(pillFor(container, OTHER)).not.toHaveAttribute('data-selected');
  });

  it('selects and focuses its code annotation when it has one', () => {
    const { container } = render(
      <CesrViewProvider>
        <StreamPill value={AID} annotation={{ category: 'matter', code: 'E' }} />
      </CesrViewProvider>,
    );
    const btn = container.querySelector('.cesr-pill button')!;
    fireEvent.click(btn); // open -> select + focus the code annotation
    expect(pillFor(container, AID)).toHaveAttribute('data-selected');
    fireEvent.click(btn); // close -> onOpenChange(false) -> no-op, selection persists
    expect(pillFor(container, AID)).toHaveAttribute('data-selected');
  });
});
