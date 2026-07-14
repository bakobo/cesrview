import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the product name so the scaffold is provably wired up', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /cesr viewer/i })).toBeInTheDocument();
  });
});
