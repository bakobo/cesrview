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

  it('does NOT caption the pill with a code+gloss label — the value shows as the entviz mnemonic (m8pv3k)', () => {
    render(<PrimitiveChip node={node()} bytes={bytes} />);
    // A host label would win over the mnemonic in entviz (shownLabel = label ?? autoMnemonic); we
    // pass none, so the long code+gloss caption must not appear — the value is handled like a
    // SAID/identifier pill (its mnemonic), same as every other value in the stream.
    expect(screen.queryByText(/Blake3-256 digest/)).not.toBeInTheDocument();
    expect(screen.queryByText(/E: /)).not.toBeInTheDocument();
  });

  it('does not caption an unannotated code either', () => {
    render(<PrimitiveChip node={node({ code: 'ZZ' })} bytes={bytes} />);
    expect(screen.queryByText('ZZ')).not.toBeInTheDocument();
  });

  it('renders the pill as a button, so it is natively keyboard-operable', () => {
    const { container } = render(<PrimitiveChip node={node()} bytes={bytes} />);
    expect(container.querySelector('.cesr-pill button')).toBeInTheDocument();
  });

  it('renders a CESR datetime (Dater) as a prettified datetime, like the dt field — not a pill', () => {
    const dater = new TextEncoder().encode('1AAG2020-08-22T17c50c09d988921p00c00'); // 36-char Dater
    const { container } = render(
      <PrimitiveChip node={node({ code: '1AAG', span: { start: 0, end: 36 } })} bytes={dater} />,
    );
    expect(screen.getByText(/22 August 17:50 UTC/)).toBeInTheDocument(); // prettified, same as dt
    expect(container.querySelector('.cesr-pill')).not.toBeInTheDocument(); // not an entviz pill
  });
});
