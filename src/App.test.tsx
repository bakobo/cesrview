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

  it('collapses a run of interaction events into one expandable card', () => {
    render(<App />);
    const runSample = readFileSync('src/cesr/__tests__/fixtures/tiny-run-kel.cesr', 'utf8');
    fireEvent.change(screen.getByLabelText('CESR stream'), { target: { value: runSample } });
    expect(screen.getAllByRole('article')).toHaveLength(1); // only the icp card; the 4 ixn are collapsed
    fireEvent.click(screen.getByRole('button', { name: /interaction events/i }));
    expect(screen.getAllByRole('article')).toHaveLength(5); // icp + 4 expanded ixn, in place
  });

  it('keeps the source pane collapsed by default and reveals it on toggle', () => {
    render(<App />);
    paste();
    expect(screen.queryByRole('region', { name: 'Source' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Source' }));
    expect(screen.getByRole('region', { name: 'Source' })).toBeInTheDocument();
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
    const { container } = render(<App />);
    paste();
    // Each recurring value is a StreamPill wrapper carrying data-value; the controller AID recurs.
    const pills = [...container.querySelectorAll<HTMLElement>('.cesr-pill[data-value]')].filter((p) =>
      /^[A-Za-z0-9_-]{44}$/.test(p.getAttribute('data-value') ?? ''),
    );
    const firstAid = pills[0].getAttribute('data-value');
    const sameValue = pills.filter((p) => p.getAttribute('data-value') === firstAid);
    expect(sameValue.length).toBeGreaterThan(1); // the controller AID recurs across the icp and ixn bodies
    fireEvent.click(pills[0].querySelector('button')!); // open the pill -> selects its value
    const highlighted = sameValue.filter((p) => p.hasAttribute('data-selected'));
    expect(highlighted.length).toBe(sameValue.length); // every occurrence of the selected value lights up
  });

  it('surfaces a parse error for input that is not a CESR stream', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('CESR stream'), { target: { value: 'garbage' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/no cesr version string/i);
  });
});
