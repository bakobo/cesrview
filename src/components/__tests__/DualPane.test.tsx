import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DualPane } from '../DualPane';

describe('DualPane', () => {
  it('renders the source and decoded panes side by side', () => {
    render(<DualPane source={<div>SRC</div>} decoded={<div>DEC</div>} />);
    expect(screen.getByText('SRC')).toBeInTheDocument();
    expect(screen.getByText('DEC')).toBeInTheDocument();
  });
});
