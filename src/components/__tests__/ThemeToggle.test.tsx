import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeToggle, savedTheme } from '../ThemeToggle';

/** A controllable window.matchMedia stub: reports `matchesLight` for the prefers-color-scheme query
 * and lets a test flip that value and fire a 'change' to simulate the OS theme changing. */
function mockMatchMedia(matchesLight: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches: matchesLight,
    media: '(prefers-color-scheme: light)',
    addEventListener: (_type: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_type: string, cb: () => void) => listeners.delete(cb),
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql),
  );
  return {
    listenerCount: () => listeners.size,
    fireChange(nextMatchesLight: boolean) {
      mql.matches = nextMatchesLight;
      act(() => listeners.forEach((cb) => cb()));
    },
  };
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('savedTheme resolution', () => {
    it('uses a stored light choice', () => {
      localStorage.setItem('cesrview-theme', 'light');
      expect(savedTheme()).toBe('light');
    });

    it('uses a stored dark choice', () => {
      localStorage.setItem('cesrview-theme', 'dark');
      expect(savedTheme()).toBe('dark');
    });

    it('falls back to dark when nothing is stored and no matchMedia exists (jsdom)', () => {
      expect(savedTheme()).toBe('dark');
    });

    it('follows the OS to light when unset and the browser prefers light', () => {
      mockMatchMedia(true);
      expect(savedTheme()).toBe('light');
    });

    it('follows the OS to dark when unset and the browser prefers dark', () => {
      mockMatchMedia(false);
      expect(savedTheme()).toBe('dark');
    });
  });

  it('applies the resolved default (dark, no matchMedia) to <html>', () => {
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: /switch to light theme/i })).toBeInTheDocument();
  });

  it('applies the OS default (light) to <html> when the browser prefers light', () => {
    mockMatchMedia(true);
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument();
  });

  it('toggles from the default, applies it to <html>, and persists the explicit choice', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /switch to light theme/i }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('cesrview-theme')).toBe('light');
    expect(screen.getByRole('button', { name: /switch to dark theme/i })).toBeInTheDocument();
  });

  it('does not persist a theme until the user makes an explicit choice', () => {
    render(<ThemeToggle />);
    expect(localStorage.getItem('cesrview-theme')).toBeNull();
  });

  it('restores a saved choice on mount and toggles back the other way', () => {
    localStorage.setItem('cesrview-theme', 'light');
    expect(savedTheme()).toBe('light');
    render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('light');
    fireEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('cesrview-theme')).toBe('dark');
  });

  it('follows live OS theme changes while the user has not chosen', () => {
    const mm = mockMatchMedia(false); // start: OS prefers dark
    const { unmount } = render(<ThemeToggle />);
    expect(document.documentElement.dataset.theme).toBe('dark');

    mm.fireChange(true); // OS switches to light
    expect(document.documentElement.dataset.theme).toBe('light');
    mm.fireChange(false); // OS switches back to dark
    expect(document.documentElement.dataset.theme).toBe('dark');

    unmount(); // cleanup removes the listener
    expect(mm.listenerCount()).toBe(0);
  });

  it('an explicit choice overrides later OS changes', () => {
    const mm = mockMatchMedia(false);
    render(<ThemeToggle />);
    // Choose dark explicitly (button offers "light" since default is dark; click twice via re-query).
    fireEvent.click(screen.getByRole('button', { name: /switch to light theme/i }));
    fireEvent.click(screen.getByRole('button', { name: /switch to dark theme/i }));
    expect(localStorage.getItem('cesrview-theme')).toBe('dark');

    mm.fireChange(true); // OS now prefers light, but the explicit dark choice must win
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('does not subscribe to OS changes when a choice is already stored', () => {
    localStorage.setItem('cesrview-theme', 'dark');
    const mm = mockMatchMedia(true);
    render(<ThemeToggle />);
    expect(mm.listenerCount()).toBe(0);
  });
});
