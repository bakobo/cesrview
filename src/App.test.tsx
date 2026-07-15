import { readFileSync } from 'node:fs';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('shows the product name and a paste prompt initially', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /cesr viewer/i })).toBeInTheDocument();
    expect(screen.getByText(/paste cesr above/i)).toBeInTheDocument();
  });

  it('decodes a pasted CESR stream into one event per message', () => {
    render(<App />);
    const sample = readFileSync('src/cesr/__tests__/fixtures/tiny-piped-kel.cesr', 'utf8');
    fireEvent.change(screen.getByLabelText('CESR stream'), { target: { value: sample } });
    expect(screen.getAllByRole('article')).toHaveLength(2); // icp + ixn
    expect(screen.getByText(/inception/i)).toBeInTheDocument();
    expect(screen.getByText(/interaction/i)).toBeInTheDocument();
  });

  it('surfaces a parse error for input that is not a CESR stream', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('CESR stream'), { target: { value: 'garbage' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/no cesr version string/i);
  });
});
