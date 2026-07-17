import { readFileSync } from 'node:fs';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

const sample = readFileSync('src/cesr/__tests__/fixtures/tiny-piped-kel.cesr', 'utf8');
const paste = () => fireEvent.change(screen.getByLabelText('CESR stream'), { target: { value: sample } });

describe('App', () => {
  it('shows the brand and a paste prompt initially', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /cesrview/i })).toBeInTheDocument();
    expect(screen.getByText(/paste cesr into the left panel/i)).toBeInTheDocument();
  });

  it('decodes a pasted stream, showing ONE event (the first) with every event in the outline', () => {
    render(<App />);
    paste();
    expect(screen.getAllByRole('article')).toHaveLength(1); // one event at a time
    expect(screen.getByText(/inception/i)).toBeInTheDocument(); // the first event (icp) is shown
    // both events are listed in the outline as navigation
    expect(screen.getByRole('button', { name: /event 1: icp/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /event 2: ixn/i })).toBeInTheDocument();
  });

  it('shows the event selected in the outline, one at a time', () => {
    render(<App />);
    paste();
    expect(screen.getByText(/inception/i)).toBeInTheDocument(); // first shown by default
    fireEvent.click(screen.getByRole('button', { name: /event 2: ixn/i }));
    expect(screen.getByText(/interaction/i)).toBeInTheDocument(); // now the ixn
    expect(screen.getAllByRole('article')).toHaveLength(1); // still just one
  });

  it('prettifies the pasted stream into an always-present source view in the input panel', () => {
    render(<App />);
    expect(screen.queryByRole('region', { name: 'Source' })).not.toBeInTheDocument(); // nothing yet
    paste();
    expect(screen.getByRole('region', { name: 'Source' })).toBeInTheDocument(); // no toggle — just there
  });

  it('cross-references a value in the shown event: locating it highlights it', () => {
    const { container } = render(<App />);
    paste();
    const pill = container.querySelector<HTMLElement>('.cesr-center .cesr-pill[data-value]');
    fireEvent.click(pill!.querySelector('button')!); // expand the entviz popover
    fireEvent.click(screen.getByRole('button', { name: /find other occurrences/i })); // locate -> select
    expect(pill).toHaveAttribute('data-selected');
  });

  it('surfaces a parse error for input that is not a CESR stream', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('CESR stream'), { target: { value: 'garbage' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/no cesr version string/i);
  });
});
