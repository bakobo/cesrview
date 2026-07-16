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
  it('renders each pretty line with its number and byte span', () => {
    const { container } = render(<SourcePane doc={doc} />);
    const lines = container.querySelectorAll('.cesr-source-line');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveTextContent('line-one');
    expect(lines[0]).toHaveAttribute('data-start', '0');
    expect(lines[0].querySelector('.ln')).toHaveTextContent('1'); // 1-based line number
  });

  it('omits the span attributes for a line with no byte origin', () => {
    const { container } = render(<SourcePane doc={doc} />);
    expect(container.querySelectorAll('.cesr-source-line')[1]).not.toHaveAttribute('data-start');
  });

  it('is a labelled region (read-only, no inputs)', () => {
    render(<SourcePane doc={doc} />);
    expect(screen.getByRole('region', { name: 'Source' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
