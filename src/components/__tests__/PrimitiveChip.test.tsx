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
// The entviz pill never draws the raw value; the value lives on cesrview's own wrapper (see StreamPill).
const pillFor = (c: HTMLElement, v: string) => c.querySelector<HTMLElement>(`.cesr-pill[data-value="${v}"]`);

describe('PrimitiveChip', () => {
  it('renders a pill carrying the value sliced from the source bytes', () => {
    const { container } = render(<PrimitiveChip node={node()} bytes={bytes} />);
    expect(pillFor(container, 'ELXXiPwoaWOV')).toBeInTheDocument();
  });

  it('labels the pill with the code and its gloss for a known code', () => {
    render(<PrimitiveChip node={node()} bytes={bytes} />);
    expect(screen.getByText(/E: Blake3-256 digest/)).toBeInTheDocument();
  });

  it('falls back to just the code as the label when the code is not annotated', () => {
    render(<PrimitiveChip node={node({ code: 'ZZ' })} bytes={bytes} />);
    expect(screen.getByText('ZZ')).toBeInTheDocument();
  });

  it('renders the pill as a button, so it is natively keyboard-operable', () => {
    const { container } = render(<PrimitiveChip node={node()} bytes={bytes} />);
    expect(container.querySelector('.cesr-pill button')).toBeInTheDocument();
  });
});
