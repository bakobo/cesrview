import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeToggle, savedTheme } from '../ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('defaults to dark and applies it to <html>', () => {
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument();
  });

  it('toggles to light, applies it to <html>, and persists the choice', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /switch to light theme/i }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('cesrview-theme')).toBe('light');
    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument();
  });

  it('restores the saved theme on mount', () => {
    localStorage.setItem('cesrview-theme', 'light');
    expect(savedTheme()).toBe('light');
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
