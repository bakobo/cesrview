import { describe, it, expect } from 'vitest';
import { specHref } from '../spec';

describe('specHref', () => {
  it('returns the section URL unchanged when there is no find phrase', () => {
    expect(specHref('https://spec/#sec')).toBe('https://spec/#sec');
    expect(specHref('https://spec/#sec', '')).toBe('https://spec/#sec');
  });

  it('appends a text-fragment directive after an existing #fragment', () => {
    expect(specHref('https://spec/#sec', 'signing threshold')).toBe(
      'https://spec/#sec:~:text=signing%20threshold',
    );
  });

  it('adds the # when the base URL has no fragment', () => {
    expect(specHref('https://spec/', 'foo bar')).toBe('https://spec/#:~:text=foo%20bar');
  });

  it('percent-escapes a hyphen so it is not read as the range separator', () => {
    expect(specHref('https://spec/#sec', 'Blake3-256 digest')).toBe(
      'https://spec/#sec:~:text=Blake3%2D256%20digest',
    );
  });
});
