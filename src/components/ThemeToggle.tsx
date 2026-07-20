import { useEffect, useState } from 'react';

const KEY = 'cesrview-theme';
const LIGHT_QUERY = '(prefers-color-scheme: light)';
export type Theme = 'dark' | 'light';

/** The user's explicitly saved theme, or null if they have never chosen (then we follow the OS). */
function storedTheme(): Theme | null {
  const v = localStorage.getItem(KEY);
  return v === 'light' || v === 'dark' ? v : null;
}

/** The OS/browser preference, defaulting to dark when the environment can't report one. */
function systemTheme(): Theme {
  return window.matchMedia?.(LIGHT_QUERY).matches ? 'light' : 'dark';
}

/** The theme to paint: an explicit choice wins; otherwise follow the OS (dark as the final fallback).
 * Exported so the pre-React inline script in index.html and React resolve the first paint identically
 * (decision s7prf4). */
export function savedTheme(): Theme {
  return storedTheme() ?? systemTheme();
}

/** Header control that flips the whole palette by setting `data-theme` on <html> (the CSS does the
 * rest — every color is a token). The default follows the OS/browser preference; a click makes an
 * explicit, persisted choice that overrides the OS thereafter (s7prf4). */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(savedTheme);

  // Apply to <html> whenever it changes (idempotent with the pre-paint script).
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Until the user makes an explicit choice, track live OS theme changes.
  useEffect(() => {
    if (storedTheme()) return;
    const mq = window.matchMedia?.(LIGHT_QUERY);
    if (!mq) return;
    const onChange = () => setTheme(storedTheme() ?? (mq.matches ? 'light' : 'dark'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const choose = (t: Theme) => {
    localStorage.setItem(KEY, t); // an explicit choice persists and stops us following the OS
    setTheme(t);
  };
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => choose(next)}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
