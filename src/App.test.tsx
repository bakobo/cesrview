import { readFileSync } from 'node:fs';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

const sample = readFileSync('src/cesr/__tests__/fixtures/tiny-piped-kel.cesr', 'utf8');
const paste = () => fireEvent.change(screen.getByLabelText('CESR stream'), { target: { value: sample } });

describe('App', () => {
  it('shows the brand and a paste prompt initially', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /cesrview/i })).toBeInTheDocument();
    expect(screen.getByText(/paste cesr above/i)).toBeInTheDocument();
  });

  it('decodes a pasted CESR stream into one event per message', () => {
    render(<App />);
    paste();
    expect(screen.getAllByRole('article')).toHaveLength(2); // icp + ixn
    expect(screen.getAllByText(/inception/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/interaction/i).length).toBeGreaterThan(0);
  });

  it('explains a clicked ilk badge in the annotation dock', () => {
    render(<App />);
    paste();
    fireEvent.click(screen.getByRole('button', { name: 'icp' }));
    const dock = screen.getByRole('region', { name: 'Annotation' });
    expect(within(dock).getByText(/inception/i)).toBeInTheDocument();
  });

  it('jumps to an event when its outline item is clicked', () => {
    render(<App />);
    paste();
    fireEvent.click(screen.getByRole('button', { name: /event 1: ixn/i }));
    expect(screen.getAllByRole('article')).toHaveLength(2); // goto ran without error
  });

  it('cross-references identifiers: selecting one highlights its other occurrences', () => {
    render(<App />);
    paste();
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
