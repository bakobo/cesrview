import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PrimitiveChip } from '../PrimitiveChip';
import type { Primitive } from '../../cesr/types';

const bytes = new TextEncoder().encode('XXELXXiPwoaWOVXX'); // value 'ELXXiPwoaWOV' at [2, 14)
const node = (over: Partial<Primitive> = {}): Primitive => ({
  kind: 'primitive',
  code: 'E',
  class: 'matter',
  span: { start: 2, end: 14 },
  ...over,
});

describe('PrimitiveChip', () => {
  it('renders the value sliced from the source bytes', () => {
    render(<PrimitiveChip node={node()} bytes={bytes} />);
    expect(screen.getByText('ELXXiPwoaWOV')).toBeInTheDocument();
  });

  it('exposes the code and its gloss as an accessible label for a known code', () => {
    render(<PrimitiveChip node={node()} bytes={bytes} />);
    const chip = screen.getByRole('button');
    expect(chip).toHaveAttribute('aria-label', expect.stringContaining('Blake3'));
    expect(chip).toHaveAttribute('data-code', 'E');
  });

  it('falls back to just the code when the code is not annotated', () => {
    render(<PrimitiveChip node={node({ code: 'ZZ' })} bytes={bytes} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'ZZ');
  });

  it('renders as a button, so it is natively keyboard-operable', () => {
    render(<PrimitiveChip node={node()} bytes={bytes} />);
    expect(screen.getByRole('button')).toHaveTextContent('ELXXiPwoaWOV');
  });
});
