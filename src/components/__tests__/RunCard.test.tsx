import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RunCard } from '../RunCard';
import type { CesrMessage } from '../../cesr/types';

const bytes = new TextEncoder().encode('');
const ixn = (sn: string): CesrMessage => ({
  proto: 'KERI', version: '1.0', kind: 'JSON', ilk: 'ixn', sn, said: 'd', sad: { t: 'ixn', s: sn }, span: { start: 0, end: 0 }, attachments: [],
});
const runs = [ixn('1'), ixn('2'), ixn('3')];

describe('RunCard', () => {
  it('shows a collapsed summary with the count and sn span', () => {
    const { container } = render(<RunCard messages={runs} start={5} bytes={bytes} open={false} onToggle={vi.fn()} />);
    const btn = screen.getByRole('button', { name: /interaction events/i });
    expect(container.querySelector('.run-count')).toHaveTextContent('3');
    expect(btn).toHaveTextContent('sn 1'); // the sn span (1–3)
    expect(screen.queryByRole('article')).not.toBeInTheDocument(); // nothing rendered while collapsed
  });

  it('calls the host toggle when the collapsed summary is clicked', () => {
    const onToggle = vi.fn();
    render(<RunCard messages={runs} start={5} bytes={bytes} open={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: /interaction events/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders the individual event cards in place when open, each with its stream-position id', () => {
    const { container } = render(<RunCard messages={runs} start={5} bytes={bytes} open onToggle={vi.fn()} />);
    expect(screen.getAllByRole('article')).toHaveLength(3); // every event shown, in place
    expect(container.querySelector('#event-7')).toBeInTheDocument(); // start + 2, an interior ixn
  });
});
