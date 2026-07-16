import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SadValue } from '../SadValue';

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2';
// A high-entropy value becomes a StreamPill; its value lives on the .cesr-pill wrapper, not the button.
const pills = (c: HTMLElement) => c.querySelectorAll('.cesr-pill[data-value]');

describe('SadValue', () => {
  it('renders a high-entropy string as a cross-reference pill', () => {
    const { container } = render(<SadValue value={AID} />);
    expect(container.querySelector(`.cesr-pill[data-value="${AID}"]`)).toBeInTheDocument();
  });

  it('renders a small string as plain text, not a pill', () => {
    const { container } = render(<SadValue value="1/3" />);
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(pills(container)).toHaveLength(0);
  });

  it('renders each element of an array (chipping the high-entropy ones)', () => {
    const { container } = render(<SadValue value={[AID, '1/3']} />);
    expect(container.querySelector(`.cesr-pill[data-value="${AID}"]`)).toBeInTheDocument(); // the key -> pill
    expect(screen.getByText('1/3')).toBeInTheDocument(); // the threshold -> text
    expect(pills(container)).toHaveLength(1);
  });

  it('renders a non-string, non-array value as JSON', () => {
    const { container } = render(<SadValue value={{ x: 1 }} />);
    expect(screen.getByText('{"x":1}')).toBeInTheDocument();
    expect(pills(container)).toHaveLength(0);
  });
});
