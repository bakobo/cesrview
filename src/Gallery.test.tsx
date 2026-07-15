import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Gallery from './Gallery';

describe('Gallery', () => {
  it('renders a titled section for each tier-2 component', () => {
    render(<Gallery />);
    expect(screen.getByRole('heading', { name: /component gallery/i })).toBeInTheDocument();
    for (const name of ['PrimitiveChip', 'ValueChip', 'SadValue', 'AttachmentGroup', 'DecodedEvent']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
  });
});
