import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RunCard } from '../RunCard';
import type { CesrMessage } from '../../cesr/types';

const bytes = new TextEncoder().encode('');
const ixn = (sn: string): CesrMessage => ({
  proto: 'KERI', version: '1.0', kind: 'JSON', ilk: 'ixn', sn, said: 'd', sad: { t: 'ixn', s: sn }, span: { start: 0, end: 0 }, attachments: [],
});

describe('RunCard', () => {
  it('shows a collapsed summary with the count and sn span', () => {
    const { container } = render(<RunCard messages={[ixn('1'), ixn('2'), ixn('3')]} start={5} bytes={bytes} />);
    const btn = screen.getByRole('button', { name: /interaction events/i });
    expect(container.querySelector('.run-count')).toHaveTextContent('3');
    expect(btn).toHaveTextContent('sn 1'); // the sn span (1–3)
    expect(screen.queryByRole('article')).not.toBeInTheDocument(); // nothing rendered while collapsed
  });

  it('expands in place to the individual event cards on click', () => {
    render(<RunCard messages={[ixn('1'), ixn('2'), ixn('3')]} start={5} bytes={bytes} />);
    fireEvent.click(screen.getByRole('button', { name: /interaction events/i }));
    expect(screen.getAllByRole('article')).toHaveLength(3); // every event now shown, in place
  });
});
