import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../Header';

describe('Header', () => {
  it('shows the stream stats, the inferred kind, and the structure-only integrity notice', () => {
    render(
      <Header
        events={102}
        logs={11}
        encoding="KERI1.0 · JSON"
        stream={{ kind: 'OOBI / endpoint reply stream', composition: '11 identifiers · 79 ixn' }}
        onPrint={() => {}}
      />,
    );
    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('KERI1.0 · JSON')).toBeInTheDocument();
    expect(screen.getByText('OOBI / endpoint reply stream')).toBeInTheDocument(); // inferred kind
    expect(screen.getByText(/structure only/i)).toBeInTheDocument();
  });

  it('omits the stream kind when there is nothing decoded', () => {
    const { container } = render(
      <Header events={0} logs={0} encoding="—" stream={null} onPrint={() => {}} />,
    );
    expect(container.querySelector('.stat-stream')).toBeNull();
  });

  it('offers a print trigger that reports the chosen scope', () => {
    const onPrint = vi.fn();
    render(<Header events={0} logs={0} encoding="—" stream={null} onPrint={onPrint} />);
    fireEvent.click(screen.getByRole('button', { name: /print/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /this event/i }));
    expect(onPrint).toHaveBeenCalledWith('event');
  });
});
