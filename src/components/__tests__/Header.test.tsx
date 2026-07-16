import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Header } from '../Header';

describe('Header', () => {
  it('shows the stream stats and the structure-only integrity notice', () => {
    render(<Header events={102} logs={11} encoding="KERI1.0 · JSON" />);
    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('KERI1.0 · JSON')).toBeInTheDocument();
    expect(screen.getByText(/structure only/i)).toBeInTheDocument();
  });
});
