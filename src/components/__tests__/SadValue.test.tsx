import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SadValue } from '../SadValue';

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2';

describe('SadValue', () => {
  it('renders a high-entropy string as a cross-reference chip', () => {
    render(<SadValue value={AID} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-value', AID);
  });

  it('renders a small string as plain text, not a chip', () => {
    render(<SadValue value="1/3" />);
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders each element of an array (chipping the high-entropy ones)', () => {
    render(<SadValue value={[AID, '1/3']} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-value', AID); // the key -> chip
    expect(screen.getByText('1/3')).toBeInTheDocument(); // the threshold -> text
  });

  it('renders a non-string, non-array value as JSON', () => {
    render(<SadValue value={{ x: 1 }} />);
    expect(screen.getByText('{"x":1}')).toBeInTheDocument();
  });
});
