import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import Root from './Root';

describe('Root', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('shows the app by default and switches to the gallery on hash change', () => {
    render(<Root />);
    expect(screen.getByText(/paste cesr above/i)).toBeInTheDocument(); // the App view
    act(() => {
      window.location.hash = '#gallery';
      window.dispatchEvent(new Event('hashchange'));
    });
    expect(screen.getByRole('heading', { name: /component gallery/i })).toBeInTheDocument();
  });
});
