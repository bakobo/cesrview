import { readFileSync } from 'node:fs';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('shows the brand and a paste prompt initially', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /cesrview/i })).toBeInTheDocument();
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

  it('cross-references identifiers: selecting one highlights its other occurrences', () => {
    render(<App />);
    const sample = readFileSync('src/cesr/__tests__/fixtures/tiny-piped-kel.cesr', 'utf8');
    fireEvent.change(screen.getByLabelText('CESR stream'), { target: { value: sample } });
    const aids = screen
      .getAllByRole('button')
      .filter((b) => /^[A-Za-z0-9_-]{44}$/.test(b.getAttribute('data-value') ?? ''));
    expect(aids.length).toBeGreaterThan(1); // the controller AID recurs across the icp and ixn bodies
    fireEvent.click(aids[0]);
    const highlighted = screen.getAllByRole('button').filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(highlighted.length).toBeGreaterThan(1); // every occurrence of the selected value lights up
  });

  it('surfaces a parse error for input that is not a CESR stream', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('CESR stream'), { target: { value: 'garbage' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/no cesr version string/i);
  });
});
