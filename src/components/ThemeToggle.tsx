import { useEffect, useState } from 'react';

const KEY = 'cesrview-theme';
export type Theme = 'dark' | 'light';

/** The saved theme, defaulting to dark. Exported so the initial paint can apply it before React. */
export function savedTheme(): Theme {
  return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
}

/** Header control that flips the whole palette by setting `data-theme` on <html> (the CSS does the
 * rest — every color is a token) and remembers the choice. Dark is the default. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(savedTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(KEY, theme);
  }, [theme]);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      onClick={() => setTheme(next)}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
