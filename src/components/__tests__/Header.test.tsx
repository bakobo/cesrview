import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Header } from '../Header';

describe('Header', () => {
  it('shows the stream stats, the inferred kind, and the structure-only integrity notice', () => {
    render(
      <Header
        events={102}
        logs={11}
        encoding="KERI1.0 · JSON"
        stream={{ kind: 'OOBI / endpoint reply stream', composition: '11 identifiers · 79 ixn' }}
      />,
    );
    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('KERI1.0 · JSON')).toBeInTheDocument();
    expect(screen.getByText('OOBI / endpoint reply stream')).toBeInTheDocument(); // inferred kind
    expect(screen.getByText(/structure only/i)).toBeInTheDocument();
  });

  it('omits the stream kind when there is nothing decoded', () => {
    const { container } = render(<Header events={0} logs={0} encoding="—" stream={null} />);
    expect(container.querySelector('.stat-stream')).toBeNull();
  });
});
