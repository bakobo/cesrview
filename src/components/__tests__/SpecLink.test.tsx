import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SpecLink } from '../SpecLink';

describe('SpecLink', () => {
  it('renders the gloss as an external link to the spec section', () => {
    render(<SpecLink gloss="signing threshold" spec="https://spec/#sec" />);
    const a = screen.getByRole('link', { name: /signing threshold/i });
    expect(a).toHaveAttribute('href', 'https://spec/#sec');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('targets the exact phrase with a text fragment when find is given', () => {
    render(<SpecLink gloss="signing threshold" spec="https://spec/#sec" find="signing threshold" />);
    expect(screen.getByRole('link', { name: /signing threshold/i })).toHaveAttribute(
      'href',
      'https://spec/#sec:~:text=signing%20threshold',
    );
  });
});
