import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SadValue } from '../SadValue';

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2';
const DIG = 'EMpPWxPVNynsdN8H_n1i0YapjdM1pOWCjaGlkmjmTNMn';
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

  it('renders an object (an anchored seal) as a structured key/value block, not raw JSON', () => {
    // an ixn event seal: {i, s, d} — anchored identifier, its sn, its digest, plus an unglossed key
    const { container } = render(<SadValue value={{ i: AID, s: '0', d: DIG, x: 'other' }} />);
    expect(container.querySelector('.cesr-obj')).toBeInTheDocument();
    expect(container.querySelector('.cesr-obj')?.textContent).not.toContain('{"'); // no raw JSON
    expect(container.querySelector(`.cesr-pill[data-value="${AID}"]`)).toBeInTheDocument(); // i -> pill
    expect(container.querySelector(`.cesr-pill[data-value="${DIG}"]`)).toBeInTheDocument(); // d -> pill
    expect(screen.getByText('0')).toBeInTheDocument(); // s -> plain
    expect(screen.getByText('(prefix/AID)')).toBeInTheDocument(); // known key i is glossed
    expect(screen.getByText('x')).toBeInTheDocument(); // unknown key rendered plainly
  });

  it('renders a bare scalar (number) as JSON text', () => {
    render(<SadValue value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
