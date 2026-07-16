import { render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import { describe, it, expect } from 'vitest';
import { StreamPill } from '../StreamPill';
import { CesrViewProvider } from '../CesrView';

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2';
const OTHER = '0AAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBB';
const pillFor = (c: HTMLElement, v: string) => c.querySelector<HTMLElement>(`.cesr-pill[data-value="${v}"]`);
// Cross-reference is a deliberate LOCATE act: expand the pill, then click its "Find other
// occurrences…" action (onLocate). Merely expanding no longer selects (that was the old piggyback).
const locate = (pill: HTMLElement) => {
  fireEvent.click(pill.querySelector('.cesr-pill button')!); // expand -> the entviz popover
  fireEvent.click(screen.getByRole('button', { name: /find other occurrences/i })); // onLocate
};

describe('StreamPill', () => {
  it('renders an entviz pill carrying the value, unselected', () => {
    const { container } = render(<StreamPill value={AID} label="prefix" />);
    expect(pillFor(container, AID)).toBeInTheDocument();
    expect(pillFor(container, AID)).not.toHaveAttribute('data-selected');
  });

  it('does nothing when located outside a provider (renders standalone)', () => {
    const { container } = render(<StreamPill value={AID} />);
    locate(container);
    expect(pillFor(container, AID)).not.toHaveAttribute('data-selected');
  });

  it('locating a value highlights every pill with that value, and not others', () => {
    const { container } = render(
      <CesrViewProvider>
        <StreamPill value={AID} />
        <StreamPill value={AID} />
        <StreamPill value={OTHER} />
      </CesrViewProvider>,
    );
    locate(pillFor(container, AID)!); // find-other-occurrences on the first AID pill -> select(AID)
    const aids = container.querySelectorAll(`.cesr-pill[data-value="${AID}"]`);
    expect([...aids].every((p) => p.hasAttribute('data-selected'))).toBe(true);
    expect(pillFor(container, OTHER)).not.toHaveAttribute('data-selected');
  });

  it('selects and focuses its code annotation when it is located', () => {
    const { container } = render(
      <CesrViewProvider>
        <StreamPill value={AID} annotation={{ category: 'matter', code: 'E' }} />
      </CesrViewProvider>,
    );
    locate(pillFor(container, AID)!); // expand -> find other occurrences -> select + focus the code
    expect(pillFor(container, AID)).toHaveAttribute('data-selected');
  });
});
