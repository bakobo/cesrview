import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SourcePane } from '../SourcePane';
import type { PrettyDoc } from '../../cesr/prettyprint';

const doc: PrettyDoc = {
  text: 'line-one\nline-two',
  lines: [
    { text: 'line-one', span: { start: 0, end: 5 } },
    { text: 'line-two', span: null },
  ],
};

describe('SourcePane', () => {
  it('renders each pretty line as a numbered item carrying its byte span', () => {
    render(<SourcePane doc={doc} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('line-one');
    expect(items[0]).toHaveAttribute('data-start', '0');
    expect(items[0]).toHaveAttribute('data-end', '5');
  });

  it('omits the span attributes for a line with no byte origin', () => {
    render(<SourcePane doc={doc} />);
    const items = screen.getAllByRole('listitem');
    expect(items[1]).not.toHaveAttribute('data-start');
  });

  it('is a labelled region (read-only, no inputs)', () => {
    render(<SourcePane doc={doc} />);
    expect(screen.getByRole('region', { name: 'Source' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
